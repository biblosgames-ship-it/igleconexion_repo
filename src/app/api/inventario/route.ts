import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getActiveChurchId, getSessionUserId } from '@/lib/active-church';

export async function GET(request: Request) {
  try {
    const iglesiaId = await getActiveChurchId();
    const userId = await getSessionUserId();

    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sociedad_id = searchParams.get('sociedad_id');
    const grupo_trabajo_id = searchParams.get('grupo_trabajo_id');

    if (!sociedad_id && !grupo_trabajo_id) {
      return NextResponse.json({ error: 'Falta sociedad_id o grupo_trabajo_id' }, { status: 400 });
    }

    const inventarios = await prisma.inventario.findMany({
      where: {
        iglesia_id: iglesiaId,
        ...(sociedad_id ? { sociedad_id } : {}),
        ...(grupo_trabajo_id ? { grupo_trabajo_id } : {}),
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(inventarios);
  } catch (error: any) {
    console.error('Error GET /api/inventario:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const iglesiaId = await getActiveChurchId();
    const userId = await getSessionUserId();

    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { action, data } = body;

    if (action === 'crear') {
      const { sociedad_id, grupo_trabajo_id, item, cantidad, estado, notas } = data;
      const nuevoItem = await prisma.inventario.create({
        data: {
          iglesia_id: iglesiaId,
          sociedad_id,
          grupo_trabajo_id,
          item,
          cantidad: parseInt(cantidad) || 1,
          estado: estado || 'BUENO',
          notas
        }
      });
      return NextResponse.json(nuevoItem);
    }

    if (action === 'actualizar') {
      const { id, item, cantidad, estado, notas } = data;
      const actualizado = await prisma.inventario.update({
        where: { id },
        data: {
          item,
          cantidad: parseInt(cantidad),
          estado,
          notas
        }
      });
      return NextResponse.json(actualizado);
    }

    if (action === 'eliminar') {
      const { id } = data;
      await prisma.inventario.delete({
        where: { id }
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
  } catch (error: any) {
    console.error('Error POST /api/inventario:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
