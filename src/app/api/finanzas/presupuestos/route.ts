import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getActiveChurchId } from '@/lib/active-church';

export async function GET(request: Request) {
  try {
    const iglesiaId = await getActiveChurchId();
    if (!iglesiaId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const periodo = searchParams.get('periodo');
    const anio = searchParams.get('anio');

    const whereClause: any = { iglesia_id: iglesiaId };
    
    if (periodo) whereClause.periodo = periodo;
    if (anio) whereClause.anio = parseInt(anio);

    const presupuestos = await prisma.presupuesto.findMany({
      where: whereClause,
      include: { 
        items: true,
        sociedad: true,
        grupo_trabajo: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(presupuestos);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const iglesiaId = await getActiveChurchId();
    if (!iglesiaId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const body = await request.json();
    const { id, estado } = body;

    if (!id || !estado) return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });

    const result = await prisma.presupuesto.update({
      where: { id },
      data: { estado }
    });

    return NextResponse.json({ success: true, presupuesto: result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const iglesiaId = await getActiveChurchId();
    if (!iglesiaId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const body = await request.json();
    const { id, estado, monto_aprobado, comentarios_finanzas } = body;

    if (!id || !estado) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    const updated = await prisma.presupuesto.update({
      where: { id, iglesia_id: iglesiaId },
      data: {
        estado,
        monto_aprobado: monto_aprobado !== undefined ? parseFloat(monto_aprobado) : null,
        comentarios_finanzas: comentarios_finanzas || null
      }
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
