import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getActiveChurchId } from '@/lib/active-church';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { searchParams } = new URL(request.url);
    const withRespuestas = searchParams.get('with_respuestas') === 'true';

    const form = await prisma.formulario.findUnique({
      where: { id: (await params).id },
      include: {
        preguntas: {
          orderBy: { orden: 'asc' }
        },
        ...(withRespuestas ? {
          respuestas: {
            include: {
              persona: { select: { nombre: true, correo: true, telefono: true, sexo: true, fecha_nacimiento: true, grupo_conexion: { select: { nombre_grupo: true } } } },
              detalles: true
            },
            orderBy: { createdAt: 'desc' }
          }
        } : {})
      }
    });

    if (!form) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    return NextResponse.json(form);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const iglesiaId = await getActiveChurchId();
    if (!iglesiaId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const data = await request.json();

    const actualizado = await prisma.formulario.update({
      where: { id: (await params).id },
      data: {
        titulo: data.titulo,
        descripcion: data.descripcion,
        estado: data.estado,
        target_rol: data.target_rol !== undefined ? data.target_rol : undefined,
        target_grupo_id: data.target_grupo_id !== undefined ? data.target_grupo_id : undefined,
        target_sociedad_id: data.target_sociedad_id !== undefined ? data.target_sociedad_id : undefined,
        target_evento_id: data.target_evento_id !== undefined ? data.target_evento_id : undefined,
        target_etapa_id: data.target_etapa_id !== undefined ? data.target_etapa_id : undefined,
        es_popup_obligatorio: data.es_popup_obligatorio !== undefined ? data.es_popup_obligatorio : undefined
      }
    });

    return NextResponse.json(actualizado);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { action, payload } = await request.json();

    if (action === 'guardar_preguntas') {
      const id = (await params).id;
      // Eliminar las anteriores y crear las nuevas para simplificar
      await prisma.preguntaFormulario.deleteMany({
        where: { formulario_id: id }
      });
      
      const creadas = await prisma.$transaction(
        payload.preguntas.map((p: any, i: number) => prisma.preguntaFormulario.create({
          data: {
            formulario_id: id,
            tipo: p.tipo,
            pregunta: p.pregunta,
            opciones: p.opciones ? JSON.stringify(p.opciones) : null,
            obligatoria: p.obligatoria,
            orden: i
          }
        }))
      );
      
      return NextResponse.json(creadas);
    }

    if (action === 'enviar_respuesta') {
      const id = (await params).id;
      const { persona_id, respuestas } = payload;
      
      const respuesta = await prisma.respuestaFormulario.create({
        data: {
          formulario_id: id,
          persona_id: persona_id,
          detalles: {
            create: respuestas.map((r: any) => ({
              pregunta_id: r.pregunta_id,
              valor: r.valor
            }))
          }
        }
      });
      
      return NextResponse.json(respuesta);
    }

    return NextResponse.json({ error: 'Acción inválida' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const iglesiaId = await getActiveChurchId();
    if (!iglesiaId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    await prisma.formulario.delete({
      where: { id: (await params).id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
