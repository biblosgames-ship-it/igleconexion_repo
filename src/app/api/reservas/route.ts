import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getActiveChurchId } from '@/lib/active-church';

async function notificarMiembros(iglesiaId: string, titulo: string, mensaje: string) {
  try {
    const usuarios = await prisma.usuario.findMany({
      where: { iglesia_id: iglesiaId },
      select: { id: true }
    });

    if (usuarios.length > 0) {
      await prisma.notificacion.createMany({
        data: usuarios.map(u => ({
          usuario_id: u.id,
          titulo,
          mensaje,
          tipo: 'INFO'
        }))
      });
    }
  } catch (err) {
    console.error("Error al enviar notificaciones:", err);
  }
}

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
      const salon = await prisma.salonEspacio.findUnique({
        where: { id: data.salon_id }
      });
      if (!salon || salon.iglesia_id !== iglesiaId) {
        return NextResponse.json({ error: 'Salón no encontrado' }, { status: 404 });
      }

      // Validar colisiones
      const conflict = await prisma.reservaEspacio.findFirst({
        where: {
          salon_id: data.salon_id,
          estado: { in: ['PENDIENTE', 'APROBADO'] },
          OR: [
            {
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
          grupo_id: data.grupo_id || null,
          grupo_tipo: data.grupo_tipo || null,
          estado: data.estado || 'PENDIENTE',
          proposito: data.proposito || null,
          notas_admin: data.notas_admin || null
        },
        include: { salon: true }
      });

      // Enviar notificación a los miembros sobre la solicitud de reunión y ubicación
      const fechaTexto = reserva.fecha_especifica 
        ? new Date(reserva.fecha_especifica).toLocaleDateString('es-ES') 
        : `Todos los ${reserva.dia_semana}`;
      
      const tituloNotif = `📅 Solicitud de Reunión: ${reserva.reservado_por}`;
      const mensajeNotif = `Se agendó una reunión para ${reserva.reservado_por}.\n📍 Ubicación: ${reserva.salon?.nombre || 'Templo'}\n🗓️ Fecha: ${fechaTexto}\n⏰ Hora: ${reserva.hora_inicio} - ${reserva.hora_fin}\n(Estado: Pendiente de aprobación por Admin del Templo)`;

      await notificarMiembros(iglesiaId, tituloNotif, mensajeNotif);

      return NextResponse.json(reserva);
    }

    if (action === 'aprobar') {
      const original = await prisma.reservaEspacio.findUnique({
        where: { id: data.id },
        include: { salon: true }
      });
      if (!original || original.iglesia_id !== iglesiaId) {
        return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 });
      }

      const actualizada = await prisma.reservaEspacio.update({
        where: { id: data.id },
        data: {
          estado: 'APROBADO',
          notas_admin: data.notas_admin || 'Reserva aprobada por la administración del templo.'
        },
        include: { salon: true }
      });

      const fechaTexto = actualizada.fecha_especifica 
        ? new Date(actualizada.fecha_especifica).toLocaleDateString('es-ES') 
        : `Todos los ${actualizada.dia_semana}`;

      await notificarMiembros(
        iglesiaId, 
        `✅ Reserva Aprobada: ${actualizada.reservado_por}`,
        `La reunión de ${actualizada.reservado_por} ha sido APROBADA.\n📍 Salón: ${actualizada.salon.nombre}\n🗓️ Fecha: ${fechaTexto}\n⏰ Hora: ${actualizada.hora_inicio} - ${actualizada.hora_fin}`
      );

      return NextResponse.json(actualizada);
    }

    if (action === 'mover') {
      const original = await prisma.reservaEspacio.findUnique({
        where: { id: data.id },
        include: { salon: true }
      });
      if (!original || original.iglesia_id !== iglesiaId) {
        return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 });
      }

      const nuevoSalon = await prisma.salonEspacio.findUnique({ where: { id: data.nuevo_salon_id || original.salon_id } });

      const actualizada = await prisma.reservaEspacio.update({
        where: { id: data.id },
        data: {
          salon_id: data.nuevo_salon_id || original.salon_id,
          hora_inicio: data.hora_inicio || original.hora_inicio,
          hora_fin: data.hora_fin || original.hora_fin,
          fecha_especifica: data.fecha_especifica ? new Date(data.fecha_especifica) : original.fecha_especifica,
          dia_semana: data.dia_semana !== undefined ? data.dia_semana : original.dia_semana,
          estado: 'APROBADO',
          notas_admin: data.notas_admin || 'Reubicado de salón/horario por el Administrador del Templo.'
        },
        include: { salon: true }
      });

      const fechaTexto = actualizada.fecha_especifica 
        ? new Date(actualizada.fecha_especifica).toLocaleDateString('es-ES') 
        : `Todos los ${actualizada.dia_semana}`;

      await notificarMiembros(
        iglesiaId, 
        `🔄 Cambio de Salón / Horario: ${actualizada.reservado_por}`,
        `Atención: La reunión de ${actualizada.reservado_por} fue reubicada.\n📍 Nuevo Salón: ${actualizada.salon.nombre}\n🗓️ Fecha: ${fechaTexto}\n⏰ Horario: ${actualizada.hora_inicio} - ${actualizada.hora_fin}\nNota: ${actualizada.notas_admin}`
      );

      return NextResponse.json(actualizada);
    }

    if (action === 'rechazar') {
      const original = await prisma.reservaEspacio.findUnique({ where: { id: data.id } });
      if (!original || original.iglesia_id !== iglesiaId) {
        return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 });
      }

      const actualizada = await prisma.reservaEspacio.update({
        where: { id: data.id },
        data: {
          estado: 'RECHAZADO',
          notas_admin: data.notas_admin || 'No disponible para la fecha/horario solicitado.'
        }
      });

      await notificarMiembros(
        iglesiaId,
        `❌ Reserva Rechazada: ${original.reservado_por}`,
        `La solicitud de espacio para ${original.reservado_por} no pudo ser aprobada.\nMotivo: ${data.notas_admin || 'Conflicto de espacio'}`
      );

      return NextResponse.json(actualizada);
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
