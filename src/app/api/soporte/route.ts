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
      where: { id: sessionUserId }
    });

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    if (user.rol === "SUPERADMIN") {
      // Superadmin ve todos los tickets
      const tickets = await prisma.soporteTicket.findMany({
        include: {
          iglesia: {
            select: { nombre_iglesia: true, subdominio_o_slug: true }
          },
          mensajes: {
            orderBy: { createdAt: "asc" }
          }
        },
        orderBy: { updatedAt: "desc" }
      });
      return NextResponse.json(tickets);
    } else {
      // Admin de la iglesia ve solo los suyos
      const tickets = await prisma.soporteTicket.findMany({
        where: { iglesia_id: user.iglesia_id },
        include: {
          mensajes: {
            orderBy: { createdAt: "asc" }
          }
        },
        orderBy: { updatedAt: "desc" }
      });
      return NextResponse.json(tickets);
    }
  } catch (error: any) {
    console.error("Error in GET /api/soporte:", error);
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
      where: { id: sessionUserId },
      include: { persona: true }
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
      case "createTicket": {
        const { asunto, descripcion, prioridad, contactoNom, contactoEml, contactoTel } = data;
        if (!asunto || !descripcion || !contactoNom || !contactoEml) {
          return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
        }

        const ticket = await prisma.soporteTicket.create({
          data: {
            iglesia_id: user.iglesia_id,
            asunto,
            descripcion,
            prioridad: prioridad || "MEDIA",
            contactoNom,
            contactoEml,
            contactoTel: contactoTel || null,
            mensajes: {
              create: {
                remitente: "CLIENTE",
                nombre: contactoNom,
                mensaje: descripcion
              }
            }
          },
          include: {
            mensajes: true
          }
        });

        return NextResponse.json(ticket);
      }

      case "sendMessage": {
        const { ticketId, mensaje } = data;
        if (!ticketId || !mensaje || !mensaje.trim()) {
          return NextResponse.json({ error: "Faltan datos del mensaje" }, { status: 400 });
        }

        const ticket = await prisma.soporteTicket.findUnique({
          where: { id: ticketId }
        });

        if (!ticket) {
          return NextResponse.json({ error: "Ticket no encontrado" }, { status: 404 });
        }

        // Validar permisos: cliente solo puede escribir en el ticket de su iglesia, superadmin en cualquiera
        if (user.rol !== "SUPERADMIN" && ticket.iglesia_id !== user.iglesia_id) {
          return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        const remitente = user.rol === "SUPERADMIN" ? "SOPORTE" : "CLIENTE";
        const nombre = user.persona?.nombre || (user.rol === "SUPERADMIN" ? "Soporte Técnico" : user.email.split("@")[0]);

        const soporteMensaje = await prisma.soporteMensaje.create({
          data: {
            ticketId,
            remitente,
            nombre,
            mensaje
          }
        });

        // Actualizar el ticket para marcar que se actualizó
        await prisma.soporteTicket.update({
          where: { id: ticketId },
          data: { updatedAt: new Date() }
        });

        return NextResponse.json(soporteMensaje);
      }

      case "updateTicketStatus": {
        const { ticketId, estado, prioridad } = data;
        if (!ticketId) {
          return NextResponse.json({ error: "Falta id de ticket" }, { status: 400 });
        }

        const ticket = await prisma.soporteTicket.findUnique({
          where: { id: ticketId }
        });

        if (!ticket) {
          return NextResponse.json({ error: "Ticket no encontrado" }, { status: 404 });
        }

        // Solo superadmin o el creador de la iglesia del ticket pueden modificar el estado
        if (user.rol !== "SUPERADMIN" && ticket.iglesia_id !== user.iglesia_id) {
          return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        const updateData: any = {};
        if (estado) updateData.estado = estado;
        if (prioridad) updateData.prioridad = prioridad;

        const updatedTicket = await prisma.soporteTicket.update({
          where: { id: ticketId },
          data: updateData
        });

        return NextResponse.json(updatedTicket);
      }

      default:
        return NextResponse.json({ error: `Acción '${action}' no soportada.` }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Error in POST /api/soporte:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
