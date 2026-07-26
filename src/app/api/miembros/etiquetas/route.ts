import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActiveChurchId, getSessionUserId } from "@/lib/active-church";

// Plantillas de etiquetas por defecto
const DEFAULT_TAGS = [
  { nombre: "Enfermo", color: "#ef4444", icono: "🤒", duracion_dias_defecto: 7 },
  { nombre: "Viudo/a", color: "#475569", icono: "🖤", duracion_dias_defecto: 365 },
  { nombre: "Madre soltera", color: "#ec4899", icono: "👩‍👧", duracion_dias_defecto: 365 },
  { nombre: "Universitario fuera de la ciudad", color: "#3b82f6", icono: "🎓", duracion_dias_defecto: 180 },
  { nombre: "Hospitalizado", color: "#f97316", icono: "🏥", duracion_dias_defecto: 5 },
  { nombre: "Luto familiar", color: "#1e293b", icono: "🕯️", duracion_dias_defecto: 15 },
];

export async function GET(request: Request) {
  try {
    const activeChurchId = await getActiveChurchId();
    const userId = await getSessionUserId();

    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get("memberId");

    // 1. Obtener etiquetas de la iglesia
    let tags = await prisma.etiqueta.findMany({
      where: { iglesia_id: activeChurchId },
      orderBy: { nombre: "asc" },
    });

    // Si no hay etiquetas registradas, inicializar las por defecto
    if (tags.length === 0) {
      await prisma.etiqueta.createMany({
        data: DEFAULT_TAGS.map((t) => ({
          iglesia_id: activeChurchId,
          ...t,
        })),
      });

      tags = await prisma.etiqueta.findMany({
        where: { iglesia_id: activeChurchId },
        orderBy: { nombre: "asc" },
      });
    }

    // 2. Si se requiere historial para un miembro específico
    let history: any[] = [];
    if (memberId) {
      history = await prisma.personaEtiqueta.findMany({
        where: { persona_id: memberId },
        include: { etiqueta: true },
        orderBy: { createdAt: "desc" },
      });
    }

    return NextResponse.json({ tags, history });
  } catch (error: any) {
    console.error("Error in GET /api/miembros/etiquetas:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const activeChurchId = await getActiveChurchId();
    const userId = await getSessionUserId();

    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener rol del usuario
    const userObj = await prisma.usuario.findUnique({
      where: { id: userId },
      include: { persona: true },
    });

    if (!userObj || !["SUPERADMIN", "ADMIN_IGLESIA", "LIDER"].includes(userObj.rol)) {
      return NextResponse.json({ error: "Prohibido: Permisos insuficientes" }, { status: 403 });
    }

    const body = await request.json();
    const { action, data } = body;

    if (!action) {
      return NextResponse.json({ error: "Acción requerida" }, { status: 400 });
    }

    const liderNombre = userObj.persona?.nombre || userObj.email.split("@")[0];

    switch (action) {
      case "assignTag": {
        const { memberId, tagId, duracionDias, notas } = data;

        if (!memberId || !tagId) {
          return NextResponse.json({ error: "Faltan datos obligatorios (memberId, tagId)" }, { status: 400 });
        }

        const tag = await prisma.etiqueta.findUnique({
          where: { id: tagId },
        });

        if (!tag) {
          return NextResponse.json({ error: "Etiqueta no encontrada" }, { status: 404 });
        }

        // Si ya tiene una etiqueta activa del mismo tipo, marcarla como inactiva
        await prisma.personaEtiqueta.updateMany({
          where: {
            persona_id: memberId,
            etiqueta_id: tagId,
            activa: true,
          },
          data: { activa: false },
        });

        const dias = duracionDias !== undefined ? parseInt(duracionDias) : tag.duracion_dias_defecto;
        const fecha_fin = dias > 0 ? new Date(Date.now() + dias * 24 * 60 * 60 * 1000) : null;

        const newAssignment = await prisma.personaEtiqueta.create({
          data: {
            persona_id: memberId,
            etiqueta_id: tagId,
            creado_por: liderNombre,
            notas: notas || null,
            fecha_fin,
            activa: true,
          },
          include: { etiqueta: true },
        });

        return NextResponse.json(newAssignment);
      }

      case "createTag": {
        const { nombre, color, icono, duracion_dias_defecto } = data;

        if (!nombre) {
          return NextResponse.json({ error: "El nombre de la etiqueta es requerido" }, { status: 400 });
        }

        const newTag = await prisma.etiqueta.create({
          data: {
            iglesia_id: activeChurchId,
            nombre,
            color: color || "#ef4444",
            icono: icono || "⚠️",
            duracion_dias_defecto: duracion_dias_defecto !== undefined ? parseInt(duracion_dias_defecto) : 7,
          },
        });

        return NextResponse.json(newTag);
      }

      case "removeTag": {
        const { assignmentId } = data;

        if (!assignmentId) {
          return NextResponse.json({ error: "Falta el ID de asignación" }, { status: 400 });
        }

        const updated = await prisma.personaEtiqueta.update({
          where: { id: assignmentId },
          data: { activa: false },
        });

        return NextResponse.json(updated);
      }

      default:
        return NextResponse.json({ error: "Acción no soportada" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Error in POST /api/miembros/etiquetas:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
