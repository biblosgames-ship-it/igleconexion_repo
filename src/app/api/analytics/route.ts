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

    const now = new Date();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Todas las queries base en paralelo
    const [totalMiembros, sociedades, personasBySexo, etapas, totalSeguimientos, totalOracionActivas, totalOracionRespondidas, finanzasIngresos, finanzasEgresos, familiasUnique, lideresUnique, totalDepartamentos, totalMinisterios, totalInstituciones, gruposFamiliaList] = await Promise.all([
      prisma.persona.count({ where: { iglesia_id: iglesiaId } }),
      prisma.sociedad.findMany({ where: { iglesia_id: iglesiaId }, select: { id: true } }),
      prisma.persona.groupBy({ by: ['sexo'], where: { iglesia_id: iglesiaId }, _count: { _all: true } }),
      prisma.etapaConfig.findMany({ where: { iglesia_id: iglesiaId }, select: { id: true, nombre_etapa: true } }),
      prisma.bitacoraPastoral.count({ where: { iglesia_id: iglesiaId } }),
      prisma.peticionOracion.count({ where: { iglesia_id: iglesiaId, estado: { in: ['ACTIVA', 'ORANDO'] } } }),
      prisma.peticionOracion.count({ where: { iglesia_id: iglesiaId, estado: 'RESPONDIDA' } }),
      prisma.transaccionFinanciera.aggregate({ where: { iglesia_id: iglesiaId, tipo: 'INGRESO', fecha: { gte: startOfCurrentMonth } }, _sum: { monto: true } }),
      prisma.transaccionFinanciera.aggregate({ where: { iglesia_id: iglesiaId, tipo: 'EGRESO', fecha: { gte: startOfCurrentMonth } }, _sum: { monto: true } }),
      prisma.persona.groupBy({ by: ['familia_codigo'], where: { iglesia_id: iglesiaId, familia_codigo: { not: null } } }),
      prisma.liderModulo.groupBy({ by: ['usuario_id'], where: { usuario: { iglesia_id: iglesiaId } } }),
      prisma.grupoTrabajo.count({ where: { iglesia_id: iglesiaId, tipo: 'DEPARTAMENTO' } }),
      prisma.grupoTrabajo.count({ where: { iglesia_id: iglesiaId, tipo: 'MINISTERIO' } }),
      prisma.grupoTrabajo.count({ where: { iglesia_id: iglesiaId, tipo: 'INSTITUCION' } }),
      prisma.grupoFamilia.findMany({
        where: { iglesia_id: iglesiaId },
        select: {
          id: true,
          numero_grupo: true,
          nombre_grupo: true,
          _count: { select: { personas: true } }
        }
      })
    ]);

    const sociedadIds = sociedades.map((s) => s.id);

    const [totalGrupos, distribucionEtapas, miembrosPorMes, grupos, uniquePastoralIds] = await Promise.all([
      prisma.grupoConexion.count({ where: { sociedad_id: { in: sociedadIds } } }),
      Promise.all(
        etapas.map(async (etapa) => {
          const [count, tasksInStage] = await Promise.all([
            prisma.persona.count({ where: { iglesia_id: iglesiaId, etapa_id: etapa.id } }),
            prisma.tareaConfig.findMany({ where: { etapa_id: etapa.id }, select: { id: true } }),
          ]);
          const taskIds = tasksInStage.map(t => t.id);
          let averageCompletion = 0;
          if (count > 0 && taskIds.length > 0) {
            const completedTasksCount = await prisma.historialTarea.count({
              where: { tarea_id: { in: taskIds }, completada: true, persona: { etapa_id: etapa.id } }
            });
            averageCompletion = Math.round((completedTasksCount / (count * taskIds.length)) * 100);
          }
          return { nombre_etapa: etapa.nombre_etapa, count, completionRate: averageCompletion };
        })
      ),
      Promise.all(
        Array.from({ length: 6 }, async (_, i) => {
          const date = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
          const year = date.getFullYear();
          const month = date.getMonth();
          const startOfMonth = new Date(year, month, 1);
          const endOfMonth = new Date(year, month + 1, 1);
          const count = await prisma.persona.count({
            where: { iglesia_id: iglesiaId, createdAt: { gte: startOfMonth, lt: endOfMonth } },
          });
          return { mes: `${year}-${String(month + 1).padStart(2, '0')}`, count };
        })
      ),
      prisma.grupoConexion.findMany({ where: { sociedad_id: { in: sociedadIds } }, select: { id: true, nombre_grupo: true } }),
      prisma.bitacoraPastoral.findMany({ where: { iglesia_id: iglesiaId, fecha: { gte: thirtyDaysAgo } }, select: { persona_id: true }, distinct: ['persona_id'] }),
    ]);

    const asistenciaGrupos = await Promise.all(
      grupos.map(async (grupo) => {
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
                if (Array.isArray(parsed)) presentesLength = parsed.length;
              }
            } catch (err) { console.error('Error parsing presentes_ids JSON', err); }
            return sum + presentesLength;
          }, 0);
          promedioAsistencia = totalPresentes / asistencias.length;
        }
        const totalMiembrosGrupo = await prisma.persona.count({ where: { grupo_conexion_id: grupo.id } });
        return { nombre_grupo: grupo.nombre_grupo, promedio_asistencia: Math.round(promedioAsistencia * 100) / 100, totalMiembros: totalMiembrosGrupo };
      })
    );

    const distribucionSexo: { M: number; F: number; otro: number } = { M: 0, F: 0, otro: 0 };
    for (const entry of personasBySexo) {
      if (entry.sexo === 'M') distribucionSexo.M = entry._count._all;
      else if (entry.sexo === 'F') distribucionSexo.F = entry._count._all;
      else distribucionSexo.otro += entry._count._all;
    }

    const desgloseGruposFamilia = gruposFamiliaList.map(gf => ({
      id: gf.id,
      numero_grupo: gf.numero_grupo,
      nombre_grupo: gf.nombre_grupo,
      totalMiembros: gf._count.personas
    }));

    return NextResponse.json({
      totalMiembros,
      totalGrupos,
      totalGruposFamilia: gruposFamiliaList.length,
      desgloseGruposFamilia,
      totalFamilias: familiasUnique.length,
      totalLideres: lideresUnique.length,
      totalDepartamentos,
      totalMinisterios,
      totalInstituciones,
      distribucionSexo,
      distribucionEtapas,
      miembrosPorMes,
      asistenciaGrupos,
      totalSeguimientos,
      coberturaPastoral: uniquePastoralIds.length,
      totalOracionActivas,
      totalOracionRespondidas,
      totalIngresosMes: finanzasIngresos._sum.monto || 0,
      totalEgresosMes: finanzasEgresos._sum.monto || 0
    });
  } catch (error) {
    console.error('[analytics/GET]', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
