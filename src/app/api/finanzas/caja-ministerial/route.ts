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

    let caja = await prisma.cajaChicaMinisterial.findUnique({
      where: { cuenta_fondo_id: cuentaFondoId },
      include: {
        transacciones_menores: {
          orderBy: { createdAt: 'desc' },
          take: 20
        }
      }
    });

    if (!caja) {
      caja = await prisma.cajaChicaMinisterial.create({
        data: {
          iglesia_id: iglesiaId,
          cuenta_fondo_id: cuentaFondoId,
          balance: 0.0,
          limite_gasto_menor: 50.0
        },
        include: {
          transacciones_menores: true
        }
      });
    }

    return NextResponse.json(caja);
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

    if (action === 'configurar_caja') {
      const { cuenta_fondo_id, limite_gasto_menor, balance } = data;
      if (!cuenta_fondo_id) {
        return NextResponse.json({ error: 'cuenta_fondo_id es requerido' }, { status: 400 });
      }

      const caja = await prisma.cajaChicaMinisterial.upsert({
        where: { cuenta_fondo_id },
        create: {
          iglesia_id: iglesiaId,
          cuenta_fondo_id,
          limite_gasto_menor: parseFloat(limite_gasto_menor || 50.0),
          balance: parseFloat(balance || 0.0)
        },
        update: {
          limite_gasto_menor: limite_gasto_menor !== undefined ? parseFloat(limite_gasto_menor) : undefined,
          balance: balance !== undefined ? parseFloat(balance) : undefined
        }
      });

      return NextResponse.json(caja);
    }

    if (action === 'registrar_gasto_menor') {
      const { cuenta_fondo_id, monto, descripcion } = data;
      const numMonto = parseFloat(monto);
      if (!cuenta_fondo_id || !numMonto || numMonto <= 0 || !descripcion) {
        return NextResponse.json({ error: 'Monto y descripción requeridos' }, { status: 400 });
      }

      const caja = await prisma.cajaChicaMinisterial.findUnique({
        where: { cuenta_fondo_id }
      });

      if (!caja) {
        return NextResponse.json({ error: 'Caja chica ministerial no inicializada' }, { status: 404 });
      }

      if (numMonto > caja.limite_gasto_menor) {
        return NextResponse.json({
          error: `El monto ($${numMonto.toFixed(2)}) supera el límite permitido para gastos menores autónomos ($${caja.limite_gasto_menor.toFixed(2)}). Por favor registra este movimiento mediante solicitud de aprobación.`
        }, { status: 400 });
      }

      const registrador = usuario?.persona?.nombre || usuario?.email || 'Encargado Ministerial';

      const [transaccion, cajaActualizada] = await prisma.$transaction([
        prisma.transaccionCajaChicaMinisterial.create({
          data: {
            caja_ministerial_id: caja.id,
            tipo: 'EGRESO',
            monto: numMonto,
            descripcion,
            registrado_por_nombre: registrador
          }
        }),
        prisma.cajaChicaMinisterial.update({
          where: { id: caja.id },
          data: { balance: caja.balance - numMonto }
        })
      ]);

      return NextResponse.json({ transaccion, caja: cajaActualizada });
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
