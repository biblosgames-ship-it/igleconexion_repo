import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getActiveChurchId } from '@/lib/active-church';

function calcularSiguienteFecha(fechaOriginal: Date, recurrencia: string): Date {
  const nuevaFecha = new Date(fechaOriginal);
  if (recurrencia === 'MENSUAL') {
    nuevaFecha.setMonth(nuevaFecha.getMonth() + 1);
  } else if (recurrencia === 'TRIMESTRAL') {
    nuevaFecha.setMonth(nuevaFecha.getMonth() + 3);
  } else if (recurrencia === 'SEMESTRAL') {
    nuevaFecha.setMonth(nuevaFecha.getMonth() + 6);
  } else if (recurrencia === 'ANUAL') {
    nuevaFecha.setFullYear(nuevaFecha.getFullYear() + 1);
  }
  return nuevaFecha;
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const iglesiaId = await getActiveChurchId();
    if (!iglesiaId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const bienOriginal = await prisma.bienInventario.findUnique({ where: { id: (await params).id } });
    if (bienOriginal?.iglesia_id !== iglesiaId) {
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    }

    const data = await request.json();

    const numCantidad = data.cantidad !== undefined ? parseInt(data.cantidad) : undefined;
    const numValorUnitario = data.valor_unitario !== undefined ? (data.valor_unitario ? parseFloat(data.valor_unitario) : null) : undefined;
    
    let numValorEstimado = data.valor_estimado !== undefined ? (data.valor_estimado ? parseFloat(data.valor_estimado) : null) : undefined;
    if (numCantidad !== undefined && numValorUnitario !== undefined && numValorUnitario !== null) {
      numValorEstimado = numCantidad * numValorUnitario;
    }

    const actualizado = await prisma.bienInventario.update({
      where: { id: (await params).id },
      data: {
        nombre: data.nombre,
        descripcion: data.descripcion,
        categoria: data.categoria,
        ubicacion: data.ubicacion,
        fecha_adquisicion: data.fecha_adquisicion ? new Date(data.fecha_adquisicion) : undefined,
        cantidad: numCantidad,
        valor_unitario: numValorUnitario,
        valor_estimado: numValorEstimado,
        estado: data.estado,
        notas: data.notas
      }
    });

    return NextResponse.json(actualizado);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const iglesiaId = await getActiveChurchId();
    if (!iglesiaId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    
    const bienOriginal = await prisma.bienInventario.findUnique({ where: { id: (await params).id } });
    if (bienOriginal?.iglesia_id !== iglesiaId) {
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    }

    const { action, payload } = await request.json();

    if (action === 'crear_mantenimiento') {
      const registro = await prisma.registroMantenimiento.create({
        data: {
          bien_id: (await params).id,
          tipo: payload.tipo,
          descripcion: payload.descripcion,
          fecha_programada: payload.fecha_programada ? new Date(payload.fecha_programada) : null,
          responsable: payload.responsable,
          proveedor_nombre: payload.proveedor_nombre,
          proveedor_contacto: payload.proveedor_contacto,
          recurrencia: payload.recurrencia || 'NO_REPETIR'
        }
      });
      
      // Auto-update bien status if it's an averia
      if (payload.tipo === 'REPORTE_AVERIA') {
        await prisma.bienInventario.update({
          where: { id: (await params).id },
          data: { estado: 'AVERIADO' }
        });
      } else if (payload.tipo === 'PREVENTIVO' && bienOriginal.estado === 'ACTIVO') {
        await prisma.bienInventario.update({
          where: { id: (await params).id },
          data: { estado: 'EN_MANTENIMIENTO' }
        });
      }

      return NextResponse.json(registro);
    }

    if (action === 'completar_mantenimiento') {
      const original = await prisma.registroMantenimiento.findUnique({
        where: { id: payload.registro_id }
      });

      const registro = await prisma.registroMantenimiento.update({
        where: { id: payload.registro_id },
        data: {
          estado: 'COMPLETADO',
          fecha_realizada: new Date(),
          costo: payload.costo ? parseFloat(payload.costo) : null
        }
      });

      // Auto-schedule next occurrence if recurring
      if (original && original.recurrencia && original.recurrencia !== 'NO_REPETIR' && original.fecha_programada) {
        const siguienteFecha = calcularSiguienteFecha(original.fecha_programada, original.recurrencia);
        await prisma.registroMantenimiento.create({
          data: {
            bien_id: original.bien_id,
            tipo: original.tipo,
            descripcion: original.descripcion,
            fecha_programada: siguienteFecha,
            responsable: original.responsable,
            proveedor_nombre: original.proveedor_nombre,
            proveedor_contacto: original.proveedor_contacto,
            recurrencia: original.recurrencia,
            estado: 'PENDIENTE'
          }
        });
      }
      
      // Restore bien to ACTIVO if all maintenances are resolved
      const pending = await prisma.registroMantenimiento.count({
        where: { bien_id: (await params).id, estado: 'PENDIENTE' }
      });
      if (pending === 0 && (bienOriginal.estado === 'AVERIADO' || bienOriginal.estado === 'EN_MANTENIMIENTO')) {
        await prisma.bienInventario.update({
          where: { id: (await params).id },
          data: { estado: 'ACTIVO' }
        });
      }

      return NextResponse.json(registro);
    }

    if (action === 'eliminar_mantenimiento') {
      await prisma.registroMantenimiento.delete({
        where: { id: payload.registro_id }
      });
      return NextResponse.json({ success: true });
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

    await prisma.bienInventario.delete({
      where: { id: (await params).id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
