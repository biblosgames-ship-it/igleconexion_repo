import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getActiveChurchId } from '@/lib/active-church';

export async function GET(request: Request) {
  try {
    const iglesiaId = await getActiveChurchId();
    if (!iglesiaId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const entidadId = searchParams.get('entidadId');
    const entidadTipo = searchParams.get('entidadTipo'); // 'SOCIEDAD' or 'GRUPO_TRABAJO'

    if (!entidadId || !entidadTipo) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });
    }

    const whereClause: any = { iglesia_id: iglesiaId };
    if (entidadTipo === 'SOCIEDAD') whereClause.sociedad_id = entidadId;
    if (entidadTipo === 'GRUPO_TRABAJO') whereClause.grupo_trabajo_id = entidadId;

    const presupuestos = await prisma.presupuesto.findMany({
      where: whereClause,
      include: { items: true },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(presupuestos);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const iglesiaId = await getActiveChurchId();
    if (!iglesiaId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const body = await request.json();
    const { sociedad_id, grupo_trabajo_id, anio, periodo, items } = body;

    if ((!sociedad_id && !grupo_trabajo_id) || !anio || !items || !Array.isArray(items)) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    const montoAsignado = items.reduce((acc: number, cur: any) => acc + (parseFloat(cur.monto_estimado) || 0), 0);

    const result = await prisma.$transaction(async (tx) => {
      const presupuesto = await tx.presupuesto.create({
        data: {
          iglesia_id: iglesiaId,
          sociedad_id: sociedad_id || null,
          grupo_trabajo_id: grupo_trabajo_id || null,
          anio: parseInt(anio),
          periodo: periodo || 'ANUAL',
          monto_asignado: montoAsignado,
          estado: 'ENVIADO'
        }
      });

      if (items.length > 0) {
        await tx.presupuestoItem.createMany({
          data: items.map((i: any) => ({
            presupuesto_id: presupuesto.id,
            categoria: i.categoria,
            monto_estimado: parseFloat(i.monto_estimado) || 0
          }))
        });
      }

      return presupuesto;
    });

    return NextResponse.json({ success: true, presupuesto: result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const iglesiaId = await getActiveChurchId();
    if (!iglesiaId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'Falta ID' }, { status: 400 });

    await prisma.presupuesto.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const iglesiaId = await getActiveChurchId();
    if (!iglesiaId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const body = await request.json();
    const { id, items } = body;

    if (!id || !items || !Array.isArray(items)) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    const montoAsignado = items.reduce((acc: number, cur: any) => acc + (parseFloat(cur.monto_estimado) || 0), 0);

    const result = await prisma.$transaction(async (tx) => {
      // Borrar items viejos
      await tx.presupuestoItem.deleteMany({
        where: { presupuesto_id: id }
      });

      // Crear nuevos items
      if (items.length > 0) {
        await tx.presupuestoItem.createMany({
          data: items.map((i: any) => ({
            presupuesto_id: id,
            categoria: i.categoria,
            monto_estimado: parseFloat(i.monto_estimado) || 0
          }))
        });
      }

      // Actualizar el presupuesto, reiniciando su estado a ENVIADO
      const presupuesto = await tx.presupuesto.update({
        where: { id },
        data: {
          monto_asignado: montoAsignado,
          estado: 'ENVIADO'
        }
      });

      return presupuesto;
    });

    return NextResponse.json({ success: true, presupuesto: result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
