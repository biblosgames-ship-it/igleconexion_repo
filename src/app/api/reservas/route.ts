import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getActiveChurchId } from '@/lib/active-church';

export async function GET(request: Request) {
  try {
    const iglesiaId = await getActiveChurchId();
    if (!iglesiaId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const reservas = await prisma.reservaEspacio.findMany({
      where: { iglesia_id: iglesiaId },
      include: {
        salon: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(reservas);
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
      // Verificar que el salon pertenezca a la iglesia
      const salon = await prisma.salonEspacio.findUnique({
        where: { id: data.salon_id }
      });
      if (!salon || salon.iglesia_id !== iglesiaId) {
        return NextResponse.json({ error: 'Salón no encontrado' }, { status: 404 });
      }

      // Validar colisiones simples en reservas recurrentes o específicas
      const conflict = await prisma.reservaEspacio.findFirst({
        where: {
          salon_id: data.salon_id,
          OR: [
            {
              // Colisión por día de la semana recurrente
              dia_semana: data.dia_semana,
              fecha_especifica: null,
              NOT: {
                OR: [
                  { hora_fin: { lte: data.hora_inicio } },
                  { hora_inicio: { gte: data.hora_fin } }
                ]
              }
            },
            {
              // Colisión por fecha específica única
              fecha_especifica: data.fecha_especifica ? new Date(data.fecha_especifica) : undefined,
              dia_semana: null,
              NOT: {
                OR: [
                  { hora_fin: { lte: data.hora_inicio } },
                  { hora_inicio: { gte: data.hora_fin } }
                ]
              }
            }
          ]
        }
      });

      if (conflict) {
        return NextResponse.json({ error: 'Existe un conflicto de horario para este salón.' }, { status: 400 });
      }

      const reserva = await prisma.reservaEspacio.create({
        data: {
          iglesia_id: iglesiaId,
          salon_id: data.salon_id,
          dia_semana: data.dia_semana || null,
          fecha_especifica: data.fecha_especifica ? new Date(data.fecha_especifica) : null,
          hora_inicio: data.hora_inicio,
          hora_fin: data.hora_fin,
          reservado_por: data.reservado_por,
          proposito: data.proposito
        }
      });

      return NextResponse.json(reserva);
    }

    if (action === 'eliminar') {
      const original = await prisma.reservaEspacio.findUnique({ where: { id: data.id } });
      if (!original || original.iglesia_id !== iglesiaId) {
        return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 });
      }

      await prisma.reservaEspacio.delete({
        where: { id: data.id }
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Acción inválida' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
