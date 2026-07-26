import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getActiveChurchId } from '@/lib/active-church';

export async function GET(request: Request) {
  try {
    const iglesiaId = await getActiveChurchId();
    if (!iglesiaId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const proyectos = await prisma.proyectoPromesa.findMany({
      where: { iglesia_id: iglesiaId },
      include: {
        promesas: { select: { monto_promesa: true, monto_aportado: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formatProyectos = proyectos.map(p => {
      const totalPrometido = p.promesas.reduce((acc, current) => acc + current.monto_promesa, 0);
      const totalAportado = p.promesas.reduce((acc, current) => acc + current.monto_aportado, 0);
      return { ...p, totalPrometido, totalAportado };
    });

    return NextResponse.json(formatProyectos);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const iglesiaId = await getActiveChurchId();
    if (!iglesiaId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const body = await request.json();
    const { nombre, descripcion, meta_financiera, promocionar_hub, imagen_url, instrucciones_pago, fecha_inicio, fecha_limite } = body;

    if (!nombre || !fecha_inicio) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    const proyecto = await prisma.proyectoPromesa.create({
      data: {
        iglesia_id: iglesiaId,
        nombre,
        descripcion: descripcion || null,
        meta_financiera: meta_financiera ? parseFloat(meta_financiera) : null,
        promocionar_hub: !!promocionar_hub,
        imagen_url: imagen_url || null,
        instrucciones_pago: instrucciones_pago || null,
        fecha_inicio: new Date(fecha_inicio),
        fecha_limite: fecha_limite ? new Date(fecha_limite) : null,
        estado: 'ACTIVO'
      }
    });

    return NextResponse.json(proyecto);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const iglesiaId = await getActiveChurchId();
    if (!iglesiaId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const body = await request.json();
    const { id, nombre, descripcion, meta_financiera, promocionar_hub, instrucciones_pago, estado } = body;

    if (!id) return NextResponse.json({ error: 'Falta el ID del proyecto' }, { status: 400 });

    const proyecto = await prisma.proyectoPromesa.update({
      where: { id },
      data: {
        nombre,
        descripcion: descripcion || null,
        meta_financiera: meta_financiera ? parseFloat(meta_financiera) : null,
        promocionar_hub: !!promocionar_hub,
        instrucciones_pago: instrucciones_pago || null,
        estado: estado || 'ACTIVO'
      }
    });

    return NextResponse.json(proyecto);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
