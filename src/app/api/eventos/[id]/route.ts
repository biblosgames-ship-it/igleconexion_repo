import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getActiveChurchId } from '@/lib/active-church';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const iglesiaId = await getActiveChurchId();
    if (!iglesiaId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const evento = await prisma.evento.findUnique({
      where: { id: (await params).id },
      include: {
        asistentes: {
          include: { persona: { select: { nombre: true, telefono: true, whatsapp: true } } },
          orderBy: { fecha_registro: 'desc' }
        },
        lideres: {
          include: { usuario: { select: { email: true, persona: { select: { nombre: true } } } } }
        },
        tareas: true,
        materiales: true,
        transacciones: true,
        sesiones: {
          include: {
            asistencias: true
          },
          orderBy: { fecha: 'asc' }
        }
      }
    });

    if (!evento || evento.iglesia_id !== iglesiaId) {
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    }

    return NextResponse.json(evento);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const iglesiaId = await getActiveChurchId();
    if (!iglesiaId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const data = await request.json();
    
    // Verify ownership
    const ev = await prisma.evento.findUnique({ where: { id: (await params).id } });
    if (ev?.iglesia_id !== iglesiaId) throw new Error("No autorizado");

    // Handle direct registration via PUT
    if (data.registrar_asistente) {
      const personaId = data.registrar_asistente;
      const existente = await prisma.asistenteEvento.findFirst({
        where: { evento_id: (await params).id, persona_id: personaId }
      });
      if (!existente) {
        const persona = await prisma.persona.findUnique({ where: { id: personaId } });
        await prisma.asistenteEvento.create({
          data: {
            evento_id: (await params).id,
            persona_id: personaId,
            nombre: persona?.nombre || null,
            telefono: persona?.telefono || null
          }
        });
      }
      return NextResponse.json({ success: true });
    }

    const evento = await prisma.evento.update({
      where: { id: (await params).id },
      data: {
        nombre: data.nombre,
        descripcion: data.descripcion,
        objetivo_general: data.objetivo_general,
        objetivo_especifico: data.objetivo_especifico,
        base_biblica: data.base_biblica,
        precio: data.precio !== undefined ? parseFloat(data.precio) : undefined,
        presupuesto: data.presupuesto !== undefined ? parseFloat(data.presupuesto) : undefined,
        fecha_inicio: data.fecha_inicio ? new Date(data.fecha_inicio) : undefined,
        fecha_fin: data.fecha_fin ? new Date(data.fecha_fin) : null,
        estado: data.estado,
        tipo: data.tipo,
        target_etapa_id: data.target_etapa_id !== undefined ? data.target_etapa_id : undefined,
        resultados_texto: data.resultados_texto
      }
    });

    return NextResponse.json(evento);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const iglesiaId = await getActiveChurchId();
    if (!iglesiaId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    // Verify ownership
    const ev = await prisma.evento.findUnique({ where: { id: (await params).id } });
    if (ev?.iglesia_id !== iglesiaId) throw new Error("No autorizado");

    await prisma.evento.delete({ where: { id: (await params).id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const iglesiaId = await getActiveChurchId();
    if (!iglesiaId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const data = await request.json();
    const { action } = data;

    const ev = await prisma.evento.findUnique({ where: { id: (await params).id } });
    if (ev?.iglesia_id !== iglesiaId) throw new Error("No autorizado");

    if (action === 'agregar_asistente' || data.registrar_asistente) {
      let personaId = data.registrar_asistente || data.payload?.persona_id;
      let nombre = data.payload?.nombre || data.nombre;
      let telefono = data.payload?.telefono || data.telefono;

      // Si no se envió persona_id pero sí el nombre, buscar la Persona correspondiente en la base de datos
      if (!personaId && nombre) {
        const matched = await prisma.persona.findFirst({
          where: { iglesia_id: iglesiaId, nombre: { contains: nombre } }
        });
        if (matched) {
          personaId = matched.id;
          if (!telefono) telefono = matched.telefono;
        }
      }

      // Si tenemos personaId, verificar que no esté duplicado
      if (personaId) {
        const existente = await prisma.asistenteEvento.findFirst({
          where: { evento_id: (await params).id, persona_id: personaId }
        });
        if (existente) {
          return NextResponse.json({ success: true, message: 'El usuario ya está inscrito en este evento' });
        }
      }

      const r = await prisma.asistenteEvento.create({
        data: {
          evento_id: (await params).id,
          persona_id: personaId || null,
          nombre: nombre || null,
          telefono: telefono || null
        }
      });
      return NextResponse.json(r);
    }
    
    if (action === 'marcar_asistencia') {
      const { asistente_id, asistio } = data.payload;
      const r = await prisma.asistenteEvento.update({
        where: { id: asistente_id },
        data: { asistio }
      });
      return NextResponse.json(r);
    }
    
    if (action === 'eliminar_asistente') {
      const { asistente_id } = data.payload;
      await prisma.asistenteEvento.delete({ where: { id: asistente_id } });
      return NextResponse.json({ success: true });
    }

    if (action === 'agregar_tarea') {
      const r = await prisma.tareaEvento.create({
        data: { evento_id: (await params).id, descripcion: data.payload.descripcion, asignado_a: data.payload.asignado_a }
      });
      return NextResponse.json(r);
    }
    
    if (action === 'toggle_tarea') {
      const r = await prisma.tareaEvento.update({
        where: { id: data.payload.tarea_id },
        data: { estado: data.payload.estado }
      });
      return NextResponse.json(r);
    }
    
    if (action === 'eliminar_tarea') {
      await prisma.tareaEvento.delete({ where: { id: data.payload.tarea_id } });
      return NextResponse.json({ success: true });
    }

    if (action === 'agregar_material') {
      const r = await prisma.materialEvento.create({
        data: { evento_id: (await params).id, item: data.payload.item, cantidad: parseInt(data.payload.cantidad)||1, provisto_por: data.payload.provisto_por }
      });
      return NextResponse.json(r);
    }
    
    if (action === 'toggle_material') {
      const r = await prisma.materialEvento.update({
        where: { id: data.payload.material_id },
        data: { estado: data.payload.estado }
      });
      return NextResponse.json(r);
    }

    if (action === 'eliminar_material') {
      await prisma.materialEvento.delete({ where: { id: data.payload.material_id } });
      return NextResponse.json({ success: true });
    }

    if (action === 'crear_sesion') {
      const { nombre, fecha } = data.payload;
      const r = await prisma.sesionEvento.create({
        data: { evento_id: (await params).id, nombre, fecha: new Date(fecha) }
      });
      return NextResponse.json(r);
    }

    if (action === 'eliminar_sesion') {
      const { sesion_id } = data.payload;
      await prisma.sesionEvento.delete({ where: { id: sesion_id } });
      return NextResponse.json({ success: true });
    }

    if (action === 'marcar_asistencia_sesion') {
      const { sesion_id, asistente_id, asistio } = data.payload;
      const existente = await prisma.asistenciaSesion.findUnique({
        where: { sesion_id_asistente_id: { sesion_id, asistente_id } }
      });
      if (existente) {
        const r = await prisma.asistenciaSesion.update({
          where: { id: existente.id },
          data: { asistio }
        });
        return NextResponse.json(r);
      } else {
        const r = await prisma.asistenciaSesion.create({
          data: { sesion_id, asistente_id, asistio }
        });
        return NextResponse.json(r);
      }
    }

    return NextResponse.json({ error: 'Acción inválida' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
