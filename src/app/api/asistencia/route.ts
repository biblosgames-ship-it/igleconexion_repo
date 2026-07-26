import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUserId } from '@/lib/active-church';

export async function GET(request: Request) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const grupo_conexion_id = searchParams.get('grupo_conexion_id');
    const sociedad_id = searchParams.get('sociedad_id');
    const grupo_trabajo_id = searchParams.get('grupo_trabajo_id');

    if (!grupo_conexion_id && !sociedad_id && !grupo_trabajo_id) {
      return NextResponse.json({ error: 'Falta un ID de contexto' }, { status: 400 });
    }

    const asistencias = await prisma.asistenciaReunion.findMany({
      where: {
        ...(grupo_conexion_id ? { grupo_conexion_id } : {}),
        ...(sociedad_id ? { sociedad_id } : {}),
        ...(grupo_trabajo_id ? { grupo_trabajo_id } : {}),
      },
      orderBy: { fecha: 'desc' },
      take: 20
    });

    return NextResponse.json(asistencias);
  } catch (error: any) {
    console.error('Error GET /api/asistencia:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { action, data } = body;

    if (action === 'addAttendance') {
      const { fecha, presentes_ids, grupo_conexion_id, sociedad_id, grupo_trabajo_id, titulo_reunion } = data;
      
      if (!grupo_conexion_id && !sociedad_id && !grupo_trabajo_id) {
         return NextResponse.json({ error: 'Falta un ID de contexto' }, { status: 400 });
      }

      const newAttendance = await prisma.asistenciaReunion.create({
        data: {
          grupo_conexion_id: grupo_conexion_id || null,
          sociedad_id: sociedad_id || null,
          grupo_trabajo_id: grupo_trabajo_id || null,
          fecha: new Date(fecha),
          titulo_reunion: titulo_reunion || 'Reunión Semanal',
          presentes_ids: JSON.stringify(presentes_ids || []),
        }
      });

      return NextResponse.json({ success: true, record: newAttendance });
    }

    if (action === 'deleteAttendance') {
      const { id } = data;
      await prisma.asistenciaReunion.delete({
        where: { id }
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
  } catch (error: any) {
    console.error('Error POST /api/asistencia:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
