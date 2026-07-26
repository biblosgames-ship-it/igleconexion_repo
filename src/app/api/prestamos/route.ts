import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getActiveChurchId } from '@/lib/active-church';

export async function GET(request: Request) {
  try {
    const iglesiaId = await getActiveChurchId();
    if (!iglesiaId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const prestamos = await prisma.prestamoBien.findMany({
      where: {
        bien: {
          iglesia_id: iglesiaId
        }
      },
      include: {
        bien: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(prestamos);
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
      // Verificar que el bien pertenezca a la iglesia
      const bien = await prisma.bienInventario.findUnique({
        where: { id: data.bien_id }
      });
      if (!bien || bien.iglesia_id !== iglesiaId) {
        return NextResponse.json({ error: 'Bien no encontrado' }, { status: 404 });
      }

      const prestamo = await prisma.prestamoBien.create({
        data: {
          bien_id: data.bien_id,
          persona_nombre: data.persona_nombre,
          fecha_prestamo: data.fecha_prestamo ? new Date(data.fecha_prestamo) : new Date(),
          fecha_devolucion_prevista: data.fecha_devolucion_prevista ? new Date(data.fecha_devolucion_prevista) : null,
          estado: 'PRESTADO',
          notas: data.notas
        }
      });

      return NextResponse.json(prestamo);
    }

    if (action === 'devolver') {
      const prestamo = await prisma.prestamoBien.update({
        where: { id: data.id },
        data: {
          fecha_devolucion_real: new Date(),
          estado: 'DEVUELTO',
          notas: data.notas
        }
      });
      return NextResponse.json(prestamo);
    }

    if (action === 'eliminar') {
      await prisma.prestamoBien.delete({
        where: { id: data.id }
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Acción inválida' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
