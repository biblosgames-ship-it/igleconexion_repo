import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/active-church";

export async function GET() {
  try {
    const userId = await getSessionUserId();

    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const notificaciones = await prisma.notificacion.findMany({
      where: { usuario_id: userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(notificaciones);
  } catch (error: any) {
    console.error("Error in GET /api/notificaciones:", error);
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
      case "markAsRead": {
        const { notificacionId } = data || {};
        if (notificacionId) {
          const updated = await prisma.notificacion.update({
            where: { id: notificacionId, usuario_id: userId },
            data: { leido: true },
          });
          return NextResponse.json(updated);
        } else {
          return NextResponse.json({ error: "Falta el ID de notificación" }, { status: 400 });
        }
      }

      case "markAllAsRead": {
        const result = await prisma.notificacion.updateMany({
          where: { usuario_id: userId, leido: false },
          data: { leido: true },
        });
        return NextResponse.json({ success: true, count: result.count });
      }

      default:
        return NextResponse.json({ error: `Acción '${action}' no soportada` }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Error in POST /api/notificaciones:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
