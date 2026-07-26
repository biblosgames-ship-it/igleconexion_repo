import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActiveChurchId, getSessionUserId } from "@/lib/active-church";

export async function GET(request: Request) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const personaId = searchParams.get("personaId");

    if (!personaId) {
      return NextResponse.json({ error: "Falta el ID del miembro" }, { status: 400 });
    }

    // 1. Obtener datos de la persona
    const persona = await prisma.persona.findUnique({
      where: { id: personaId },
      include: {
        etapa: true,
        grupo_conexion: true,
      },
    });

    if (!persona) {
      return NextResponse.json({ error: "Miembro no encontrado" }, { status: 404 });
    }

    const events: any[] = [];

    // A. Evento de registro (Inicio de la línea de tiempo)
    events.push({
      id: "registro",
      titulo: "Se registró en la iglesia",
      detalle: `Ingresó al sistema en la etapa "${persona.etapa?.nombre_etapa || "Inicial"}" y grupo "${persona.grupo_conexion?.nombre_grupo || "General"}".`,
      fecha: persona.createdAt,
      categoria: "SISTEMA",
      creado_por: "Sistema",
    });

    // A2. Evento de conversión (Aceptó a Cristo)
    if (persona.fecha_conversion) {
      events.push({
        id: "conversion",
        titulo: "❤️ Aceptó a Cristo / Fecha de Conversión",
        detalle: "Se registró el día en que entregó su vida a Cristo.",
        fecha: persona.fecha_conversion,
        categoria: "ESPIRITUAL",
        creado_por: "Sistema",
      });
    }

    // B. Obtener hitos manuales de HistorialPastoral
    const hitosManuales = await prisma.historialPastoral.findMany({
      where: { persona_id: personaId },
      orderBy: { fecha: "desc" },
    });

    hitosManuales.forEach((hp) => {
      events.push({
        id: hp.id,
        titulo: hp.titulo,
        detalle: hp.detalle || "",
        fecha: hp.fecha,
        categoria: hp.categoria,
        creado_por: hp.creado_por || "Pastor",
      });
    });

    // C. Obtener tareas completadas de HistorialTarea (Crecimiento/Discipulado)
    const tareasCompletadas = await prisma.historialTarea.findMany({
      where: { persona_id: personaId, completada: true },
      include: {
        tarea: true,
      },
      orderBy: { fecha_completa: "desc" },
    });

    tareasCompletadas.forEach((ht) => {
      events.push({
        id: ht.id,
        titulo: `Completó: ${ht.tarea.nombre_tarea}`,
        detalle: `Aprobó satisfactoriamente esta meta de discipulado/proceso en la iglesia.`,
        fecha: ht.fecha_completa || new Date(),
        categoria: "CRECIMIENTO",
        creado_por: ht.aprobado_por || "Sistema",
      });
    });

    // D. Obtener seguimientos de la BitacoraPastoral
    const bitacoraSeguimientos = await prisma.bitacoraPastoral.findMany({
      where: { persona_id: personaId },
      orderBy: { fecha: "desc" },
    });

    bitacoraSeguimientos.forEach((bp) => {
      let tipoStr = "Seguimiento";
      if (bp.tipo === "VISITA") tipoStr = "🏠 Visita Pastoral";
      if (bp.tipo === "LLAMADA") tipoStr = "📞 Llamada Pastoral";
      if (bp.tipo === "MENSAJE") tipoStr = "💬 Mensaje / WhatsApp";

      events.push({
        id: bp.id,
        titulo: tipoStr,
        detalle: bp.notas,
        fecha: bp.fecha,
        categoria: "PASTORAL",
        creado_por: "Líder/Pastor",
      });
    });

    // E. Obtener inasistencias a reuniones de su grupo de conexión
    if (persona.grupo_conexion_id) {
      const asistencias = await prisma.asistenciaReunion.findMany({
        where: { grupo_conexion_id: persona.grupo_conexion_id },
        orderBy: { fecha: "desc" },
      });

      asistencias.forEach((a) => {
        let presentes: string[] = [];
        try {
          presentes = JSON.parse(a.presentes_ids || "[]");
        } catch (e) {}

        if (!presentes.includes(personaId)) {
          events.push({
            id: a.id,
            titulo: `❌ Inasistencia: ${a.titulo_reunion || "Reunión de Grupo"}`,
            detalle: "Registrado como ausente en la reunión del grupo de conexión.",
            fecha: a.fecha,
            categoria: "PASTORAL",
            creado_por: "Registro de Asistencia",
          });
        }
      });
    }

    // Ordenar todos los eventos por fecha de forma descendente (más recientes primero)
    events.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

    return NextResponse.json({
      personaNombre: persona.nombre,
      events,
    });
  } catch (error: any) {
    console.error("Error in GET /api/historial-pastoral:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { action, data } = body;

    if (!action) {
      return NextResponse.json({ error: "Falta la acción" }, { status: 400 });
    }

    switch (action) {
      case "crear": {
        const { personaId, titulo, detalle, fecha, categoria } = data;

        if (!personaId || !titulo || !categoria) {
          return NextResponse.json({ error: "Faltan datos obligatorios (personaId, titulo, categoria)" }, { status: 400 });
        }

        const persona = await prisma.persona.findUnique({
          where: { id: personaId },
        });

        if (!persona) {
          return NextResponse.json({ error: "Miembro no encontrado" }, { status: 404 });
        }

        // Obtener el nombre del pastor/líder que registra
        const usuarioLogueado = await prisma.usuario.findUnique({
          where: { id: userId },
          include: { persona: true },
        });
        const nombreRegistrador = usuarioLogueado?.persona?.nombre || usuarioLogueado?.email.split("@")[0] || "Pastor";

        const nuevoHito = await prisma.historialPastoral.create({
          data: {
            iglesia_id: persona.iglesia_id,
            persona_id: personaId,
            titulo,
            detalle: detalle || null,
            fecha: fecha ? new Date(fecha) : new Date(),
            categoria,
            creado_por: nombreRegistrador,
          },
        });

        return NextResponse.json(nuevoHito);
      }

      default:
        return NextResponse.json({ error: `Acción '${action}' no soportada` }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Error in POST /api/historial-pastoral:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
