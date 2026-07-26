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
    const { familiarId, rolFamiliar } = body;

    if (!familiarId || !rolFamiliar) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
    }

    const persona = await prisma.persona.findUnique({
      where: { id: user.persona_id },
      select: { iglesia_id: true }
    });

    if (!persona) {
      return NextResponse.json({ error: 'Persona no encontrada' }, { status: 404 });
    }

    await linkFamily(persona.iglesia_id, user.persona_id, familiarId, rolFamiliar);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error linking family:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
