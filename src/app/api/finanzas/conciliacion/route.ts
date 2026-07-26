import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getActiveChurchId, getSessionUserId } from '@/lib/active-church';

export async function GET(request: Request) {
  try {
    const iglesiaId = await getActiveChurchId();
    if (!iglesiaId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    // Fetch pendientes (not reconciled, not cancelled)
    const [pendientesTrx, pendientesDiezmos] = await Promise.all([
      prisma.transaccionFinanciera.findMany({
        where: {
          iglesia_id: iglesiaId,
          conciliada: false,
          estado: { notIn: ['ANULADO', 'CANCELADO'] }
        },
        orderBy: { fecha: 'desc' },
        include: {
          cuenta_fondo: { select: { nombre: true } }
        }
      }),
      prisma.historialDiezmo.findMany({
        where: {
          iglesia_id: iglesiaId,
          conciliada: false
        },
        orderBy: { fecha: 'desc' },
        include: {
          persona: { select: { nombre: true } }
        }
      })
    ]);

    // Merge and format pendientes
    const pendientes = [
      ...pendientesTrx.map(t => ({ ...t, _origen: 'trx' })),
      ...pendientesDiezmos.map(d => ({
        id: d.id,
        iglesia_id: d.iglesia_id,
        tipo: 'INGRESO',
        clasificacion: 'DIEZMO',
        descripcion: `Diezmo - ${d.persona?.nombre || 'Anónimo'}`,
        monto: d.monto,
        fecha: d.fecha,
        metodo_pago: d.metodo_pago,
        conciliada: d.conciliada,
        fecha_conciliacion: d.fecha_conciliacion,
        referencia_bancaria: d.referencia_bancaria,
        _origen: 'diezmo'
      }))
    ].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

    // Fetch historial (reconciled), limited to recent 100 for performance
    const [historialTrx, historialDiezmos] = await Promise.all([
      prisma.transaccionFinanciera.findMany({
        where: {
          iglesia_id: iglesiaId,
          conciliada: true
        },
        orderBy: { fecha_conciliacion: 'desc' },
        take: 100,
        include: {
          cuenta_fondo: { select: { nombre: true } }
        }
      }),
      prisma.historialDiezmo.findMany({
        where: {
          iglesia_id: iglesiaId,
          conciliada: true
        },
        orderBy: { fecha_conciliacion: 'desc' },
        take: 100,
        include: {
          persona: { select: { nombre: true } }
        }
      })
    ]);

    const historial = [
      ...historialTrx.map(t => ({ ...t, _origen: 'trx' })),
      ...historialDiezmos.map(d => ({
        id: d.id,
        iglesia_id: d.iglesia_id,
        tipo: 'INGRESO',
        clasificacion: 'DIEZMO',
        descripcion: `Diezmo - ${d.persona?.nombre || 'Anónimo'}`,
        monto: d.monto,
        fecha: d.fecha,
        metodo_pago: d.metodo_pago,
        conciliada: d.conciliada,
        fecha_conciliacion: d.fecha_conciliacion,
        referencia_bancaria: d.referencia_bancaria,
        _origen: 'diezmo'
      }))
    ].sort((a, b) => {
      const dateA = a.fecha_conciliacion ? new Date(a.fecha_conciliacion).getTime() : 0;
      const dateB = b.fecha_conciliacion ? new Date(b.fecha_conciliacion).getTime() : 0;
      return dateB - dateA;
    }).slice(0, 100);

    return NextResponse.json({ pendientes, historial });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const iglesiaId = await getActiveChurchId();
    const userId = await getSessionUserId();
    
    if (!iglesiaId || !userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verify user role
    const userObj = await prisma.usuario.findUnique({ where: { id: userId } });
    if (!userObj || !['SUPERADMIN', 'LIDER'].includes(userObj.rol)) {
       return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
    }

    const body = await request.json();
    const { transaccionesIds, referencia_bancaria } = body;

    if (!transaccionesIds || !Array.isArray(transaccionesIds) || transaccionesIds.length === 0) {
      return NextResponse.json({ error: 'No se seleccionaron transacciones' }, { status: 400 });
    }

    // Perform bulk update on both tables. Since UUIDs are unique, this works perfectly.
    const [resTrx, resDiezmos] = await Promise.all([
      prisma.transaccionFinanciera.updateMany({
        where: {
          id: { in: transaccionesIds },
          iglesia_id: iglesiaId
        },
        data: {
          conciliada: true,
          fecha_conciliacion: new Date(),
          referencia_bancaria: referencia_bancaria || null
        }
      }),
      prisma.historialDiezmo.updateMany({
        where: {
          id: { in: transaccionesIds },
          iglesia_id: iglesiaId
        },
        data: {
          conciliada: true,
          fecha_conciliacion: new Date(),
          referencia_bancaria: referencia_bancaria || null
        }
      })
    ]);

    return NextResponse.json({ message: 'Transacciones conciliadas exitosamente', result: resTrx.count + resDiezmos.count });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
