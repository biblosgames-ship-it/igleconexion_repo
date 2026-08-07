import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getActiveChurchId, getSessionUserId } from '@/lib/active-church';

export async function GET(request: Request) {
  try {
    const iglesiaId = await getActiveChurchId();
    const { searchParams } = new URL(request.url);
    const cuentaFondoId = searchParams.get('cuenta_fondo_id');

    if (!cuentaFondoId) {
      return NextResponse.json({ error: 'cuenta_fondo_id es requerido' }, { status: 400 });
    }

    const subcuentas = await prisma.subCuentaFondo.findMany({
      where: { cuenta_fondo_id: cuentaFondoId },
      orderBy: { createdAt: 'asc' },
      include: {
        _count: { select: { transacciones: true } }
      }
    });

    return NextResponse.json(subcuentas);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const iglesiaId = await getActiveChurchId();
    const userId = await getSessionUserId();
    if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const body = await request.json();
    const { action, data } = body;

    if (action === 'crear_subcuenta') {
      const { cuenta_fondo_id, nombre, tipo, descripcion } = data;
      if (!cuenta_fondo_id || !nombre) {
        return NextResponse.json({ error: 'Cuenta principal y nombre son requeridos' }, { status: 400 });
      }

      const cuentaFondo = await prisma.cuentaFondo.findUnique({ where: { id: cuenta_fondo_id } });
      if (!cuentaFondo || cuentaFondo.iglesia_id !== iglesiaId) {
        return NextResponse.json({ error: 'Cuenta de fondo no válida' }, { status: 404 });
      }

      const nuevaSubcuenta = await prisma.subCuentaFondo.create({
        data: {
          cuenta_fondo_id,
          nombre,
          tipo: tipo || 'INGRESO',
          descripcion: descripcion || '',
          balance: 0.0
        }
      });

      return NextResponse.json(nuevaSubcuenta);
    }

    if (action === 'editar_subcuenta') {
      const { id, nombre, tipo, descripcion } = data;
      const subcuenta = await prisma.subCuentaFondo.findUnique({ where: { id } });
      if (!subcuenta) return NextResponse.json({ error: 'Subcuenta no encontrada' }, { status: 404 });

      const actualizada = await prisma.subCuentaFondo.update({
        where: { id },
        data: {
          nombre: nombre || subcuenta.nombre,
          tipo: tipo || subcuenta.tipo,
          descripcion: descripcion !== undefined ? descripcion : subcuenta.descripcion
        }
      });

      return NextResponse.json(actualizada);
    }

    if (action === 'eliminar_subcuenta') {
      const { id } = data;
      const subcuenta = await prisma.subCuentaFondo.findUnique({ where: { id } });
      if (!subcuenta) return NextResponse.json({ error: 'Subcuenta no encontrada' }, { status: 404 });

      await prisma.subCuentaFondo.delete({ where: { id } });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
