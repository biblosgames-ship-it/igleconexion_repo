import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getActiveChurchId, getSessionUserId } from '@/lib/active-church';

export async function GET(request: Request) {
  try {
    const iglesiaId = await getActiveChurchId();
    if (!iglesiaId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const promesas = await prisma.promesaFe.findMany({
      where: { iglesia_id: iglesiaId },
      include: {
        persona: { select: { nombre: true, foto_url: true, telefono: true } },
        proyecto: { select: { nombre: true } },
        transacciones: {
          select: { id: true, monto: true, fecha: true, metodo_pago: true },
          orderBy: { fecha: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(promesas);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const iglesiaId = await getActiveChurchId();
    if (!iglesiaId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const body = await request.json();
    const { persona_id, proyecto_id, monto_promesa, fecha_inicio, fecha_limite } = body;

    if (!persona_id || !proyecto_id || !monto_promesa || !fecha_inicio) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    const promesa = await prisma.promesaFe.create({
      data: {
        iglesia_id: iglesiaId,
        persona_id,
        proyecto_id,
        monto_promesa: parseFloat(monto_promesa),
        fecha_inicio: new Date(fecha_inicio),
        fecha_limite: fecha_limite ? new Date(fecha_limite) : null,
        estado: 'ACTIVA'
      },
      include: {
        persona: { select: { nombre: true } },
        proyecto: { select: { nombre: true } }
      }
    });

    return NextResponse.json(promesa);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
