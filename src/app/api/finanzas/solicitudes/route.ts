import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getActiveChurchId, getSessionUserId } from '@/lib/active-church';

export async function GET(request: Request) {
  try {
    const iglesiaId = await getActiveChurchId();
    const { searchParams } = new URL(request.url);
    const cuentaFondoId = searchParams.get('cuenta_fondo_id');
    const estado = searchParams.get('estado');

    const whereClause: any = { iglesia_id: iglesiaId };
    if (cuentaFondoId) whereClause.cuenta_fondo_id = cuentaFondoId;
    if (estado) whereClause.estado = estado;

    const solicitudes = await prisma.solicitudAprobacionFinanciera.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        cuenta_fondo: { select: { id: true, nombre: true } },
        subcuenta_fondo: { select: { id: true, nombre: true } }
      }
    });

    return NextResponse.json(solicitudes);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const iglesiaId = await getActiveChurchId();
    const userId = await getSessionUserId();
    if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const usuario = await prisma.usuario.findUnique({
      where: { id: userId },
      include: { persona: { select: { nombre: true } } }
    });

    const body = await request.json();
    const { action, data } = body;

    if (action === 'crear_solicitud') {
      const { cuenta_fondo_id, subcuenta_fondo_id, caja_fisica_id, tipo, monto, fecha, metodo_pago, descripcion } = data;
      const numMonto = parseFloat(monto);
      if (!cuenta_fondo_id || !numMonto || numMonto <= 0 || !descripcion) {
        return NextResponse.json({ error: 'Fondo ministerial, monto y descripción son requeridos' }, { status: 400 });
      }

      const solicitanteNombre = usuario?.persona?.nombre || usuario?.email || 'Líder Ministerial';

      const solicitud = await prisma.solicitudAprobacionFinanciera.create({
        data: {
          iglesia_id: iglesiaId,
          cuenta_fondo_id,
          subcuenta_fondo_id: subcuenta_fondo_id || null,
          caja_fisica_id: caja_fisica_id || null,
          tipo: tipo === 'EGRESO' ? 'EGRESO' : 'INGRESO',
          monto: numMonto,
          fecha: fecha ? new Date(fecha) : new Date(),
          metodo_pago: metodo_pago || 'EFECTIVO',
          descripcion,
          solicitado_por_id: userId,
          solicitado_por_nombre: solicitanteNombre,
          estado: 'PENDIENTE'
        }
      });

      return NextResponse.json(solicitud);
    }

    if (action === 'responder_solicitud') {
      const { id, estado, notas_respuesta } = data;
      if (!id || !['APROBADO', 'RECHAZADO'].includes(estado)) {
        return NextResponse.json({ error: 'ID y estado válidos requeridos' }, { status: 400 });
      }

      const solicitud = await prisma.solicitudAprobacionFinanciera.findUnique({
        where: { id },
        include: { cuenta_fondo: true, subcuenta_fondo: true }
      });

      if (!solicitud || solicitud.iglesia_id !== iglesiaId) {
        return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 });
      }

      if (solicitud.estado !== 'PENDIENTE') {
        return NextResponse.json({ error: 'Esta solicitud ya fue procesada anteriormente' }, { status: 400 });
      }

      if (estado === 'RECHAZADO') {
        const rechazada = await prisma.solicitudAprobacionFinanciera.update({
          where: { id },
          data: {
            estado: 'RECHAZADO',
            notas_respuesta: notas_respuesta || 'Solicitud no aprobada',
            aprobado_por_id: userId,
            updatedAt: new Date()
          }
        });
        return NextResponse.json(rechazada);
      }

      // Si es APROBADO: Procesar transacción oficial y actualizar balances
      const numMonto = solicitud.monto;
      const esIngreso = solicitud.tipo === 'INGRESO';
      const deltaBalance = esIngreso ? numMonto : -numMonto;

      const ops: any[] = [];

      // 1. Crear TransaccionFinanciera oficial
      const nuevaTransaccionData: any = {
        iglesia_id: iglesiaId,
        cuenta_fondo_id: solicitud.cuenta_fondo_id,
        subcuenta_fondo_id: solicitud.subcuenta_fondo_id || null,
        tipo: solicitud.tipo,
        clasificacion: 'OFRENDA',
        categoria: esIngreso ? 'OFRENDA_GENERAL' : 'SERVICIOS',
        monto: numMonto,
        fecha: solicitud.fecha,
        descripcion: `${solicitud.descripcion} (Aprobado: ${solicitud.solicitado_por_nombre})`,
        metodo_pago: solicitud.metodo_pago,
        registrado_por: usuario?.persona?.nombre || usuario?.email || 'Tesorería',
        usuario_creo_id: userId,
        estado: 'PAGADO'
      };

      const transaccionCreada = await prisma.transaccionFinanciera.create({
        data: nuevaTransaccionData
      });

      // 2. Actualizar balance de CuentaFondo (Fondo Ministerial)
      ops.push(
        prisma.cuentaFondo.update({
          where: { id: solicitud.cuenta_fondo_id },
          data: { balance: solicitud.cuenta_fondo.balance + deltaBalance }
        })
      );

      // 3. Actualizar balance de SubCuentaFondo (si aplica)
      if (solicitud.subcuenta_fondo_id && solicitud.subcuenta_fondo) {
        ops.push(
          prisma.subCuentaFondo.update({
            where: { id: solicitud.subcuenta_fondo_id },
            data: { balance: solicitud.subcuenta_fondo.balance + deltaBalance }
          })
        );
      }

      // 4. Actualizar balance de Caja Física (Caja Chica, General o Banco) si aplica
      if (solicitud.caja_fisica_id && solicitud.caja_fisica_id !== solicitud.cuenta_fondo_id) {
        const cajaFisica = await prisma.cuentaFondo.findUnique({ where: { id: solicitud.caja_fisica_id } });
        if (cajaFisica) {
          ops.push(
            prisma.cuentaFondo.update({
              where: { id: solicitud.caja_fisica_id },
              data: { balance: cajaFisica.balance + deltaBalance }
            })
          );
        }
      }

      // 5. Actualizar la SolicitudAprobacionFinanciera
      ops.push(
        prisma.solicitudAprobacionFinanciera.update({
          where: { id },
          data: {
            estado: 'APROBADO',
            notas_respuesta: notas_respuesta || 'Aprobado por Tesorería',
            aprobado_por_id: userId,
            transaccion_id: transaccionCreada.id,
            updatedAt: new Date()
          }
        })
      );

      await prisma.$transaction(ops);

      return NextResponse.json({ success: true, transaccion: transaccionCreada });
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
