import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { linkFamily } from '@/lib/family';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionUserId = cookieStore.get("session_user_id")?.value;

    if (!sessionUserId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = await prisma.usuario.findUnique({
      where: { id: sessionUserId },
      select: { persona_id: true }
    });

    if (!user || !user.persona_id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const persona = await prisma.persona.findUnique({
      where: { id: user.persona_id },
      select: { familia_codigo: true, iglesia_id: true }
    });

    if (!persona || !persona.familia_codigo) {
      return NextResponse.json({ familia: [] });
    }

    const familiares = await prisma.persona.findMany({
      where: {
        iglesia_id: persona.iglesia_id,
        familia_codigo: persona.familia_codigo
      },
      select: {
        id: true,
        nombre: true,
        rol_familiar: true,
        telefono: true,
        correo: true,
        familia_codigo: true
      }
    });

    return NextResponse.json({ familia: familiares });
  } catch (error) {
    console.error('Error fetching family:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionUserId = cookieStore.get("session_user_id")?.value;

    if (!sessionUserId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = await prisma.usuario.findUnique({
      where: { id: sessionUserId },
      select: { persona_id: true }
    });

    if (!user || !user.persona_id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { action, familiarId, rolFamiliar, telefono, correo } = body;

    const parentPersona = await prisma.persona.findUnique({
      where: { id: user.persona_id },
      select: { iglesia_id: true, familia_codigo: true }
    });

    if (!parentPersona) {
      return NextResponse.json({ error: 'Persona no encontrada' }, { status: 404 });
    }

    // Acción: Actualizar contacto de un familiar (hijo/a u otro miembro de la familia)
    if (action === "updateContact") {
      if (!familiarId) {
        return NextResponse.json({ error: 'Falta ID del familiar' }, { status: 400 });
      }

      // Validar que el familiar pertenece al mismo grupo familiar
      const targetChild = await prisma.persona.findFirst({
        where: {
          id: familiarId,
          iglesia_id: parentPersona.iglesia_id,
          familia_codigo: parentPersona.familia_codigo
        }
      });

      if (!targetChild) {
        return NextResponse.json({ error: 'El familiar no pertenece a tu núcleo familiar' }, { status: 403 });
      }

      const updatedChild = await prisma.persona.update({
        where: { id: targetChild.id },
        data: {
          telefono: telefono !== undefined ? (telefono?.trim() || null) : targetChild.telefono,
          correo: correo !== undefined ? (correo?.trim() || null) : targetChild.correo,
          whatsapp: telefono !== undefined ? (telefono?.trim() || null) : targetChild.whatsapp,
        }
      });

      // Si se asigna correo y no tiene usuario, crearlo o vincularlo
      const cleanCorreo = correo?.trim();
      if (cleanCorreo) {
        const existingUser = await prisma.usuario.findUnique({
          where: { email: cleanCorreo }
        });

        if (!existingUser) {
          await prisma.usuario.create({
            data: {
              iglesia_id: parentPersona.iglesia_id,
              email: cleanCorreo,
              password: "password123",
              rol: "MIEMBRO",
              persona_id: updatedChild.id,
            }
          });
        } else if (!existingUser.persona_id) {
          await prisma.usuario.update({
            where: { id: existingUser.id },
            data: { persona_id: updatedChild.id }
          });
        }
      }

      return NextResponse.json({ success: true, persona: updatedChild });
    }

    // Acción por defecto: Vincular nuevo familiar
    if (!familiarId || !rolFamiliar) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
    }

    await linkFamily(parentPersona.iglesia_id, user.persona_id, familiarId, rolFamiliar);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in POST /api/perfil/familia:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
