import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getActiveChurchId, getSessionUserId } from '@/lib/active-church';

export async function GET(request: Request) {
  try {
    const iglesiaId = await getActiveChurchId();
    if (!iglesiaId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const eventos = await prisma.evento.findMany({
      where: { iglesia_id: iglesiaId },
      orderBy: { fecha_inicio: 'desc' },
      include: {
        _count: {
          select: { asistentes: true, tareas: true, materiales: true }
        },
        asistentes: { select: { persona_id: true } }
      }
    });

    return NextResponse.json(eventos);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const iglesiaId = await getActiveChurchId();
    const userId = await getSessionUserId();
    if (!iglesiaId || !userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const data = await request.json();

    const evento = await prisma.evento.create({
      data: {
        iglesia_id: iglesiaId,
        nombre: data.nombre,
        descripcion: data.descripcion,
        objetivo_general: data.objetivo_general,
        objetivo_especifico: data.objetivo_especifico,
        base_biblica: data.base_biblica,
        precio: parseFloat(data.precio) || 0,
        presupuesto: parseFloat(data.presupuesto) || 0,
        fecha_inicio: new Date(data.fecha_inicio),
        fecha_fin: data.fecha_fin ? new Date(data.fecha_fin) : null,
        estado: data.estado || "PLANIFICACION",
        tipo: data.tipo || "EVENTO",
        target_etapa_id: data.target_etapa_id || null
      }
    });

    return NextResponse.json(evento);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
