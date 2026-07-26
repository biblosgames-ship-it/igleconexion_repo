import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getActiveChurchId } from '@/lib/active-church';

export async function GET(request: Request) {
  try {
    const iglesiaId = await getActiveChurchId();
    if (!iglesiaId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const formularios = await prisma.formulario.findMany({
      where: { iglesia_id: iglesiaId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { preguntas: true, respuestas: true }
        }
      }
    });

    return NextResponse.json(formularios);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const iglesiaId = await getActiveChurchId();
    if (!iglesiaId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const data = await request.json();

    const formulario = await prisma.formulario.create({
      data: {
        iglesia_id: iglesiaId,
        titulo: data.titulo || 'Formulario sin título',
        descripcion: data.descripcion || '',
        estado: 'BORRADOR'
      }
    });

    return NextResponse.json(formulario);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
