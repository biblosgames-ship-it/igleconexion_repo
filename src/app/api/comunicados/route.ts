import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionUserId = cookieStore.get("session_user_id")?.value;
    if (!sessionUserId) {
      return NextResponse.json({ error: "No ha iniciado sesión" }, { status: 401 });
    }

    const user = await prisma.usuario.findUnique({
      where: { id: sessionUserId },
      select: {
        id: true,
        iglesia_id: true,
        rol: true,
        persona: {
          select: {
            grupo_conexion: { select: { id: true, sociedad_id: true } }
          }
        },
        modulos_lider: { select: { sociedad_id: true, grupo_conexion_id: true } }
      }
    });

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    // Fetch all announcements in the church
    const allComunicados = await prisma.comunicado.findMany({
      where: { iglesia_id: user.iglesia_id },
      include: {
        leidos: {
          where: { usuarioId: user.id }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    const now = new Date();

    // Filter announcements according to recipient audience and date/time range
    const filteredComunicados = allComunicados.filter((c) => {
      // 0. Validar rango de fecha y hora de vigencia
      if (c.fechaInicio && now < new Date(c.fechaInicio)) {
        return false;
      }
      if (c.fechaFin && now > new Date(c.fechaFin)) {
        return false;
      }

      // 1. All membership
      if (c.destinatario === "TODOS") {
        return true;
      }

      // 2. Leaders and admins
      if (c.destinatario === "LIDERES") {
        return ["SUPERADMIN", "ADMIN_IGLESIA", "LIDER"].includes(user.rol);
      }

      // 3. Specific Society
      if (c.destinatario === "SOCIEDAD") {
        const isMember = user.persona?.grupo_conexion?.sociedad_id === c.destinatarioId;
        const isLeader = user.modulos_lider.some((ml) => ml.sociedad_id === c.destinatarioId);
        return isMember || isLeader || ["SUPERADMIN", "ADMIN_IGLESIA"].includes(user.rol);
      }

      // 4. Specific Connection Group
      if (c.destinatario === "GRUPO_CONEXION") {
        const isMember = user.persona?.grupo_conexion?.id === c.destinatarioId;
        const isLeader = user.modulos_lider.some((ml) => ml.grupo_conexion_id === c.destinatarioId);
        return isMember || isLeader || ["SUPERADMIN", "ADMIN_IGLESIA"].includes(user.rol);
      }

      // 5. Departamento / Ministerio Específico
      if (c.destinatario === "DEPARTAMENTO") {
        return true;
      }

      return true;
    });

    // Format output to include a simple "leido" boolean
    const result = filteredComunicados.map((c) => {
      const { leidos, ...rest } = c;
      return {
        ...rest,
        leido: leidos.length > 0
      };
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error in GET /api/comunicados:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionUserId = cookieStore.get("session_user_id")?.value;
    if (!sessionUserId) {
      return NextResponse.json({ error: "No ha iniciado sesión" }, { status: 401 });
    }

    const user = await prisma.usuario.findUnique({
      where: { id: sessionUserId }
    });

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    const body = await request.json();
    const { action, data } = body;

    if (!action) {
      return NextResponse.json({ error: "Falta la acción (action)" }, { status: 400 });
    }

    switch (action) {
      case "create": {
        // Only admins can publish official announcements
        if (!["SUPERADMIN", "ADMIN_IGLESIA"].includes(user.rol)) {
          return NextResponse.json({ error: "No autorizado para publicar comunicados oficiales" }, { status: 403 });
        }

        const { titulo, contenido, imagen, destinatario, destinatarioId, esObligatorio, fechaInicio, fechaFin } = data;
        if (!titulo || !contenido) {
          return NextResponse.json({ error: "El título y contenido son requeridos" }, { status: 400 });
        }

        const nuevoComunicado = await prisma.comunicado.create({
          data: {
            iglesia_id: user.iglesia_id,
            titulo,
            contenido,
            imagen: imagen || null,
            destinatario: destinatario || "TODOS",
            destinatarioId: destinatarioId || null,
            esObligatorio: !!esObligatorio,
            fechaInicio: fechaInicio ? new Date(fechaInicio) : null,
            fechaFin: fechaFin ? new Date(fechaFin) : null
          }
        });

        return NextResponse.json(nuevoComunicado);
      }

      case "markAsRead": {
        const { comunicadoId } = data;
        if (!comunicadoId) {
          return NextResponse.json({ error: "Falta ID del comunicado" }, { status: 400 });
        }

        // Upsert to ensure no duplicate unique constraint crashes
        const leido = await prisma.comunicadoLeido.upsert({
          where: {
            comunicadoId_usuarioId: {
              comunicadoId,
              usuarioId: user.id
            }
          },
          create: {
            comunicadoId,
            usuarioId: user.id
          },
          update: {}
        });

        return NextResponse.json({ success: true, leido });
      }

      case "delete": {
        // Only admins can delete announcements
        if (!["SUPERADMIN", "ADMIN_IGLESIA"].includes(user.rol)) {
          return NextResponse.json({ error: "No autorizado para eliminar comunicados" }, { status: 403 });
        }

        const { comunicadoId } = data;
        if (!comunicadoId) {
          return NextResponse.json({ error: "Falta ID del comunicado" }, { status: 400 });
        }

        await prisma.comunicado.delete({
          where: { id: comunicadoId }
        });

        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: `Acción '${action}' no soportada.` }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Error in POST /api/comunicados:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
