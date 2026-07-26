import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getActiveChurchId } from '@/lib/active-church';

export async function GET(request: Request) {
  try {
    const iglesiaId = await getActiveChurchId();
    if (!iglesiaId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const salones = await prisma.salonEspacio.findMany({
      where: { iglesia_id: iglesiaId },
      include: {
        reservas: {
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { nombre: 'asc' }
    });

    return NextResponse.json(salones);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const iglesiaId = await getActiveChurchId();
    if (!iglesiaId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { action, data } = await request.json();

    if (action === 'crear') {
      const salon = await prisma.salonEspacio.create({
        data: {
          iglesia_id: iglesiaId,
          nombre: data.nombre,
          capacidad: data.capacidad ? parseInt(data.capacidad) : null,
          ubicacion: data.ubicacion,
          descripcion: data.descripcion
        }
      });
      return NextResponse.json(salon);
    }

    if (action === 'editar') {
      const original = await prisma.salonEspacio.findUnique({ where: { id: data.id } });
      if (!original || original.iglesia_id !== iglesiaId) {
        return NextResponse.json({ error: 'Salón no encontrado' }, { status: 404 });
      }

      const salon = await prisma.salonEspacio.update({
        where: { id: data.id },
        data: {
          nombre: data.nombre,
          capacidad: data.capacidad ? parseInt(data.capacidad) : null,
          ubicacion: data.ubicacion,
          descripcion: data.descripcion
        }
      });
      return NextResponse.json(salon);
    }

    if (action === 'eliminar') {
      const original = await prisma.salonEspacio.findUnique({ where: { id: data.id } });
      if (!original || original.iglesia_id !== iglesiaId) {
        return NextResponse.json({ error: 'Salón no encontrado' }, { status: 404 });
      }

      await prisma.salonEspacio.delete({
        where: { id: data.id }
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Acción inválida' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
