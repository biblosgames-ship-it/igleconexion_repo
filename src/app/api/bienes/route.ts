import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getActiveChurchId } from '@/lib/active-church';

export async function GET(request: Request) {
  try {
    const iglesiaId = await getActiveChurchId();
    if (!iglesiaId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const categoria = searchParams.get('categoria');
    const estado = searchParams.get('estado');

    const bienes = await prisma.bienInventario.findMany({
      where: {
        iglesia_id: iglesiaId,
        ...(categoria ? { categoria } : {}),
        ...(estado ? { estado } : {})
      },
      orderBy: { createdAt: 'desc' },
      include: {
        mantenimientos: {
          orderBy: { fecha_programada: 'desc' }
        }
      }
    });

    return NextResponse.json(bienes);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const iglesiaId = await getActiveChurchId();
    if (!iglesiaId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const data = await request.json();

    const bien = await prisma.bienInventario.create({
      data: {
        iglesia_id: iglesiaId,
        nombre: data.nombre,
        descripcion: data.descripcion,
        categoria: data.categoria,
        ubicacion: data.ubicacion,
        fecha_adquisicion: data.fecha_adquisicion ? new Date(data.fecha_adquisicion) : null,
        valor_estimado: data.valor_estimado ? parseFloat(data.valor_estimado) : null,
        estado: data.estado || 'ACTIVO',
        notas: data.notas
      }
    });

    return NextResponse.json(bien);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
