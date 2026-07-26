import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getActiveChurchId, getSessionUserId } from '@/lib/active-church';

export async function GET() {
  try {
    // 1. Check session and get user ID
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Verify ADMIN_IGLESIA or SUPERADMIN role
    const user = await prisma.usuario.findUnique({
      where: { id: userId },
      select: { rol: true },
    });

    if (!user || (user.rol !== 'ADMIN_IGLESIA' && user.rol !== 'SUPERADMIN')) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    // 2. Get active church ID
    const iglesiaId = await getActiveChurchId();
    if (!iglesiaId) {
      return NextResponse.json({ error: 'Iglesia no encontrada' }, { status: 404 });
    }

    // 3a. totalMiembros: count of Persona records for this iglesia
    const totalMiembros = await prisma.persona.count({
      where: { iglesia_id: iglesiaId },
    });

    // Fetch all sociedades for this iglesia (needed for group queries)
    const sociedades = await prisma.sociedad.findMany({
      where: { iglesia_id: iglesiaId },
      select: { id: true },
    });
    const sociedadIds = sociedades.map((s) => s.id);

    // 3b. totalGrupos: count of GrupoConexion records linked to this iglesia's sociedades
    const totalGrupos = await prisma.grupoConexion.count({
      where: { sociedad_id: { in: sociedadIds } },
    });

    // 3c. distribucionSexo: count of Persona by sexo
    const personasBySexo = await prisma.persona.groupBy({
      by: ['sexo'],
      where: { iglesia_id: iglesiaId },
      _count: { _all: true },
    });

    const distribucionSexo: { M: number; F: number; otro: number } = {
      M: 0,
      F: 0,
      otro: 0,
    };
    for (const entry of personasBySexo) {
      if (entry.sexo === 'M') {
        distribucionSexo.M = entry._count._all;
      } else if (entry.sexo === 'F') {
        distribucionSexo.F = entry._count._all;
      } else {
        distribucionSexo.otro += entry._count._all;
      }
    }

    // 3d. distribucionEtapas: per-etapa Persona counts and average completion rate
    const etapas = await prisma.etapaConfig.findMany({
      where: { iglesia_id: iglesiaId },
      select: { id: true, nombre_etapa: true },
    });

    const distribucionEtapas = await Promise.all(
      etapas.map(async (etapa) => {
        const count = await prisma.persona.count({
          where: {
            iglesia_id: iglesiaId,
            etapa_id: etapa.id,
          },
        });

        // Fetch all tasks in this stage
        const tasksInStage = await prisma.tareaConfig.findMany({
          where: { etapa_id: etapa.id },
          select: { id: true }
        });
        const taskIds = tasksInStage.map(t => t.id);

        let averageCompletion = 0;
        if (count > 0 && taskIds.length > 0) {
          const completedTasksCount = await prisma.historialTarea.count({
            where: {
              tarea_id: { in: taskIds },
              completada: true,
              persona: { etapa_id: etapa.id }
            }
          });
          averageCompletion = Math.round((completedTasksCount / (count * taskIds.length)) * 100);
        }

        return { 
          nombre_etapa: etapa.nombre_etapa, 
          count,
          completionRate: averageCompletion 
        };
      })
    );

    // 3e. miembrosPorMes: last 6 months, count Persona created each month
    const now = new Date();
    const miembrosPorMes: { mes: string; count: number }[] = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = date.getMonth(); // 0-indexed

      const startOfMonth = new Date(year, month, 1);
      const endOfMonth = new Date(year, month + 1, 1);

      const count = await prisma.persona.count({
        where: {
          iglesia_id: iglesiaId,
          createdAt: {
            gte: startOfMonth,
            lt: endOfMonth,
          },
        },
      });

      const mesLabel = `${year}-${String(month + 1).padStart(2, '0')}`;
      miembrosPorMes.push({ mes: mesLabel, count });
    }

    // 3f. asistenciaGrupos: per-group attendance averages and member counts
    const grupos = await prisma.grupoConexion.findMany({
      where: { sociedad_id: { in: sociedadIds } },
      select: { id: true, nombre_grupo: true },
    });

    const asistenciaGrupos = await Promise.all(
      grupos.map(async (grupo) => {
        // Last 4 AsistenciaReunion records for this group
        const asistencias = await prisma.asistenciaReunion.findMany({
          where: { grupo_conexion_id: grupo.id },
          orderBy: { fecha: 'desc' },
          take: 4,
          select: { presentes_ids: true },
        });

        let promedioAsistencia = 0;
        if (asistencias.length > 0) {
          const totalPresentes = asistencias.reduce((sum, a) => {
            let presentesLength = 0;
            try {
              if (a.presentes_ids) {
                const parsed = JSON.parse(a.presentes_ids);
                if (Array.isArray(parsed)) {
                  presentesLength = parsed.length;
                }
              }
            } catch (err) {
              console.error('Error parsing presentes_ids JSON', err);
            }
            return sum + presentesLength;
          }, 0);
          promedioAsistencia = totalPresentes / asistencias.length;
        }

        // Count of Persona in this group
        const totalMiembrosGrupo = await prisma.persona.count({
          where: { grupo_conexion_id: grupo.id },
        });

        return {
          nombre_grupo: grupo.nombre_grupo,
          promedio_asistencia: Math.round(promedioAsistencia * 100) / 100,
          totalMiembros: totalMiembrosGrupo,
        };
      })
    );

    // 3g. Nuevas Métricas Pastorales
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const totalSeguimientos = await prisma.bitacoraPastoral.count({
      where: { iglesia_id: iglesiaId }
    });

    const uniquePastoralIds = await prisma.bitacoraPastoral.findMany({
      where: {
        iglesia_id: iglesiaId,
        fecha: { gte: thirtyDaysAgo }
      },
      select: { persona_id: true },
      distinct: ['persona_id']
    });
    const coberturaPastoral = uniquePastoralIds.length;

    // 3h. Oración y peticiones
    const totalOracionActivas = await prisma.peticionOracion.count({
      where: { iglesia_id: iglesiaId, estado: { in: ['ACTIVA', 'ORANDO'] } }
    });
    const totalOracionRespondidas = await prisma.peticionOracion.count({
      where: { iglesia_id: iglesiaId, estado: 'RESPONDIDA' }
    });

    // 3i. Finanzas
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const finanzasIngresos = await prisma.transaccionFinanciera.aggregate({
      where: {
        iglesia_id: iglesiaId,
        tipo: 'INGRESO',
        fecha: { gte: startOfCurrentMonth }
      },
      _sum: { monto: true }
    });
    const finanzasEgresos = await prisma.transaccionFinanciera.aggregate({
      where: {
        iglesia_id: iglesiaId,
        tipo: 'EGRESO',
        fecha: { gte: startOfCurrentMonth }
      },
      _sum: { monto: true }
    });
    const totalIngresosMes = finanzasIngresos._sum.monto || 0;
    const totalEgresosMes = finanzasEgresos._sum.monto || 0;

    // 3j. Familias Registradas
    const familiasUnique = await prisma.persona.groupBy({
      by: ['familia_codigo'],
      where: {
        iglesia_id: iglesiaId,
        familia_codigo: { not: null }
      }
    });
    const totalFamilias = familiasUnique.length;

    // 3k. Líderes Únicos
    const lideresUnique = await prisma.liderModulo.groupBy({
      by: ['usuario_id'],
      where: {
        usuario: {
          iglesia_id: iglesiaId,
        },
      },
    });
    const totalLideres = lideresUnique.length;

    // 3l. Cantidad de Departamentos, Ministerios, Instituciones
    const totalDepartamentos = await prisma.grupoTrabajo.count({
      where: { iglesia_id: iglesiaId, tipo: 'DEPARTAMENTO' }
    });
    const totalMinisterios = await prisma.grupoTrabajo.count({
      where: { iglesia_id: iglesiaId, tipo: 'MINISTERIO' }
    });
    const totalInstituciones = await prisma.grupoTrabajo.count({
      where: { iglesia_id: iglesiaId, tipo: 'INSTITUCION' }
    });

    return NextResponse.json({
      totalMiembros,
      totalGrupos,
      totalFamilias,
      totalLideres,
      totalDepartamentos,
      totalMinisterios,
      totalInstituciones,
      distribucionSexo,
      distribucionEtapas,
      miembrosPorMes,
      asistenciaGrupos,
      totalSeguimientos,
      coberturaPastoral,
      totalOracionActivas,
      totalOracionRespondidas,
      totalIngresosMes,
      totalEgresosMes
    });
  } catch (error) {
    console.error('[analytics/GET]', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
