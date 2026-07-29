import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActiveChurchId, getSessionUserId } from "@/lib/active-church";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const defaultIglesiaId = await getActiveChurchId();
    const userId = await getSessionUserId();

    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const user = await prisma.usuario.findUnique({
      where: { id: userId },
      include: {
        persona: true,
      },
    });

    if (!user || !user.persona) {
      return NextResponse.json({
        clasesActivas: [],
        clasesHistorial: [],
        eventosInscritos: [],
        eventosHistorial: [],
        promesasFe: [],
      });
    }

    const personaId = user.persona.id;
    const now = new Date();

    // 1. Clases Bíblicas de su Grupo de Conexión
    let clasesActivas: any[] = [];
    let clasesHistorial: any[] = [];

    if (user.persona.grupo_conexion_id) {
      const clases = await prisma.claseBiblica.findMany({
        where: { grupo_conexion_id: user.persona.grupo_conexion_id },
        orderBy: { fecha: "asc" },
      });

      for (const c of clases) {
        let pts: any[] = [];
        try { pts = JSON.parse(c.puntos_json || "[]"); } catch(e){}
        
        const item = {
          ...c,
          puntos: pts,
        };

        const classDate = new Date(c.fecha);
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

        if (classDate >= twoDaysAgo) {
          clasesActivas.push(item);
        } else {
          clasesHistorial.push(item);
        }
      }
    }

    // 2. Eventos e Inscripciones (asistenteEventos)
    const personaNombre = user.persona.nombre;
    const personaTelefono = user.persona.telefono;

    const asistenteRecords = await prisma.asistenteEvento.findMany({
      where: {
        OR: [
          { persona_id: personaId },
          ...(personaNombre ? [{ nombre: { contains: personaNombre } }] : []),
          ...(personaTelefono ? [{ telefono: personaTelefono }] : []),
        ]
      },
      include: {
        evento: {
          include: {
            sesiones: true,
          },
        },
      },
      orderBy: { fecha_registro: "desc" },
    });

    let eventosInscritos: any[] = [];
    let eventosHistorial: any[] = [];

    for (const record of asistenteRecords) {
      // Si la inscripción no tenía persona_id pero coincide el nombre, auto-vincularla en la DB
      if (!record.persona_id) {
        try {
          await prisma.asistenteEvento.update({
            where: { id: record.id },
            data: { persona_id: personaId }
          });
        } catch (e) { console.error("Error auto-linking persona_id", e); }
      }

      const ev = record.evento;
      if (!ev) continue;

      const item = {
        asistencia_id: record.id,
        asistio: record.asistio,
        fecha_registro: record.fecha_registro,
        evento_id: ev.id,
        nombre: ev.nombre,
        descripcion: ev.descripcion,
        objetivo_general: ev.objetivo_general,
        objetivo_especifico: ev.objetivo_especifico,
        base_biblica: ev.base_biblica,
        precio: ev.precio,
        fecha_inicio: ev.fecha_inicio,
        fecha_fin: ev.fecha_fin,
        imagen_url: ev.imagen_url,
        estado: ev.estado,
        tipo: ev.tipo,
      };

      // Si el estado está finalizado o cancelado, va al historial. De lo contrario, está activo.
      if (ev.estado === "FINALIZADO" || ev.estado === "CANCELADO") {
        eventosHistorial.push(item);
      } else {
        eventosInscritos.push(item);
      }
    }

    // 3. Promesas de Fe y Avance General del Proyecto (Porcentajes Sin Montos)
    const proyectosActivos = await prisma.proyectoPromesa.findMany({
      where: { iglesia_id: defaultIglesiaId, estado: 'ACTIVO' },
      include: {
        promesas: {
          select: {
            monto_promesa: true,
            monto_aportado: true,
            persona_id: true,
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    let proyectoPrincipal = proyectosActivos[0] || null;
    let porcentajePrometido = 0;
    let porcentajeRecaudado = 0;
    let miProgresoPorcentaje = 0;
    let tienePromesa = false;
    let proyectoNombre = proyectoPrincipal?.nombre || "Proyecto General";

    if (proyectoPrincipal) {
      const meta = proyectoPrincipal.meta_financiera || 0;
      const totalPrometido = proyectoPrincipal.promesas.reduce((sum, p) => sum + p.monto_promesa, 0);
      const totalAportado = proyectoPrincipal.promesas.reduce((sum, p) => sum + p.monto_aportado, 0);

      if (meta > 0) {
        porcentajePrometido = Math.min(100, Math.round((totalPrometido / meta) * 100));
        porcentajeRecaudado = Math.min(100, Math.round((totalAportado / meta) * 100));
      } else if (totalPrometido > 0) {
        porcentajePrometido = 100;
        porcentajeRecaudado = Math.min(100, Math.round((totalAportado / totalPrometido) * 100));
      }

      const miPromesa = proyectoPrincipal.promesas.find(p => p.persona_id === personaId);
      if (miPromesa) {
        tienePromesa = true;
        miProgresoPorcentaje = miPromesa.monto_promesa > 0 
          ? Math.min(100, Math.round((miPromesa.monto_aportado / miPromesa.monto_promesa) * 100))
          : 0;
      }
    }

    const promesasResumen = {
      tienePromesa,
      proyectoNombre,
      porcentajePrometido,
      porcentajeRecaudado,
      miProgresoPorcentaje,
    };

    const promesas = await prisma.promesaFe.findMany({
      where: { persona_id: personaId },
      include: {
        proyecto: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const promesasFe = promesas.map((p) => ({
      id: p.id,
      proyecto_nombre: p.proyecto?.nombre || "Proyecto Promesa de Fe",
      progreso_porcentaje: p.monto_promesa > 0 ? Math.min(100, Math.round((p.monto_aportado / p.monto_promesa) * 100)) : 0,
      fecha_inicio: p.fecha_inicio,
      fecha_limite: p.fecha_limite,
      estado: p.estado,
    }));

    // 4. Reuniones y Agenda de Departamentos / Ministerios (GrupoTrabajo)
    // Also find other usuario records linked to same persona (cross-church membership)
    const allUsuarioIds = [userId];
    if (user.persona_id) {
      const siblingUsers = await prisma.usuario.findMany({
        where: { persona_id: user.persona_id },
        select: { id: true },
      });
      for (const su of siblingUsers) {
        if (!allUsuarioIds.includes(su.id)) allUsuarioIds.push(su.id);
      }
    }

    const misGruposTrabajo = await prisma.miembroGrupoTrabajo.findMany({
      where: { usuario_id: { in: allUsuarioIds } },
      select: { grupo_trabajo_id: true }
    });

    const grupoIds = misGruposTrabajo.map(g => g.grupo_trabajo_id);

    let agendaDepartamentos: any[] = [];
    if (grupoIds.length > 0) {
      const reuniones = await prisma.agendaGrupoTrabajo.findMany({
        where: {
          grupo_trabajo_id: { in: grupoIds },
        },
        include: {
          grupo_trabajo: {
            select: {
              id: true,
              nombre: true,
              tipo: true
            }
          }
        },
        orderBy: { fecha: 'asc' }
      });

      agendaDepartamentos = reuniones.map(r => ({
        id: r.id,
        titulo: r.titulo,
        descripcion: r.descripcion,
        fecha: r.fecha,
        hora: r.hora,
        grupo_trabajo_id: r.grupo_trabajo_id,
        grupo_nombre: r.grupo_trabajo.nombre,
        grupo_tipo: r.grupo_trabajo.tipo
      }));
    }

    return NextResponse.json({
      clasesActivas,
      clasesHistorial,
      eventosInscritos,
      eventosHistorial,
      promesasFe,
      promesasResumen,
      agendaDepartamentos,
    });
  } catch (error: any) {
    console.error("Error in GET /api/perfil/actividades:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
