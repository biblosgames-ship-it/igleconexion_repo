import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getActiveChurchId, getSessionUserId } from '@/lib/active-church';

const ALLOWED_ROLES = ['ADMIN_IGLESIA', 'SUPERADMIN'];

async function resolveAuthorizedUser(iglesiaId: string) {
  const userId = await getSessionUserId();
  if (!userId) return null;

  const usuario = await prisma.usuario.findUnique({
    where: { id: userId },
    include: { persona: true },
  });

  if (!usuario) return null;
  if (!ALLOWED_ROLES.includes(usuario.rol)) return null;
  if (usuario.rol === 'ADMIN_IGLESIA' && usuario.iglesia_id !== iglesiaId) return null;

  return usuario;
}

export async function GET() {
  try {
    const iglesiaId = await getActiveChurchId();
    const user = await resolveAuthorizedUser(iglesiaId);
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const cuentas = await prisma.cuentaBancaria.findMany({
      where: { iglesia_id: iglesiaId }
    });

    const cajas = await prisma.cajaChica.findMany({
      where: { iglesia_id: iglesiaId }
    });

    const proyectos = await prisma.proyectoFinanciero.findMany({
      where: { iglesia_id: iglesiaId }
    });

    return NextResponse.json({ cuentas, cajas, proyectos });

  } catch (error: any) {
    console.error('[GET /api/finanzas/caja-bancos]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const iglesiaId = await getActiveChurchId();
    const user = await resolveAuthorizedUser(iglesiaId);
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const { action, data } = body;

    const userDisplayName = user.persona?.nombre || user.email.split('@')[0];

    // ─── CREAR BANCO ──────────────────────────────────────────────────
    if (action === 'crearBanco') {
      const { nombre_banco, numero_cuenta, tipo_cuenta, balance } = data ?? {};
      if (!nombre_banco || !numero_cuenta || !tipo_cuenta) {
        return NextResponse.json({ error: 'Campos requeridos: nombre_banco, numero_cuenta, tipo_cuenta' }, { status: 400 });
      }

      const cuenta = await prisma.$transaction(async (tx) => {
        const nuevo = await tx.cuentaBancaria.create({
          data: {
            iglesia_id: iglesiaId,
            nombre_banco,
            numero_cuenta,
            tipo_cuenta,
            balance: balance ? Number(balance) : 0.0
          }
        });

        await tx.auditoriaFinanciera.create({
          data: {
            iglesia_id: iglesiaId,
            usuario_id: user.id,
            usuario_nombre: userDisplayName,
            accion: 'CREAR',
            tabla_afectada: 'CuentaBancaria',
            registro_id: nuevo.id,
            detalles: JSON.stringify({ nuevoBanco: nuevo })
          }
        });

        return nuevo;
      });

      return NextResponse.json({ success: true, cuenta });
    }

    // ─── CREAR CAJA CHICA ─────────────────────────────────────────────
    if (action === 'crearCaja') {
      const { nombre_caja, balance, limite } = data ?? {};
      if (!nombre_caja) {
        return NextResponse.json({ error: 'Nombre de caja es requerido' }, { status: 400 });
      }

      const caja = await prisma.$transaction(async (tx) => {
        const nuevo = await tx.cajaChica.create({
          data: {
            iglesia_id: iglesiaId,
            nombre_caja,
            balance: balance ? Number(balance) : 0.0,
            limite: limite ? Number(limite) : 200.0,
            responsable_id: user.id,
            estado: 'ABIERTO'
          }
        });

        await tx.auditoriaFinanciera.create({
          data: {
            iglesia_id: iglesiaId,
            usuario_id: user.id,
            usuario_nombre: userDisplayName,
            accion: 'CREAR',
            tabla_afectada: 'CajaChica',
            registro_id: nuevo.id,
            detalles: JSON.stringify({ nuevaCajaChica: nuevo })
          }
        });

        return nuevo;
      });

      return NextResponse.json({ success: true, caja });
    }

    // ─── CREAR PROYECTO ───────────────────────────────────────────────
    if (action === 'crearProyecto') {
      const { nombre, descripcion, meta } = data ?? {};
      if (!nombre || !meta) {
        return NextResponse.json({ error: 'Campos requeridos: nombre, meta' }, { status: 400 });
      }

      const proyecto = await prisma.$transaction(async (tx) => {
        const nuevo = await tx.proyectoFinanciero.create({
          data: {
            iglesia_id: iglesiaId,
            nombre,
            descripcion: descripcion || '',
            meta: Number(meta),
            recaudado: 0.0,
            gastado: 0.0,
            estado: 'ACTIVO'
          }
        });

        await tx.auditoriaFinanciera.create({
          data: {
            iglesia_id: iglesiaId,
            usuario_id: user.id,
            usuario_nombre: userDisplayName,
            accion: 'CREAR',
            tabla_afectada: 'ProyectoFinanciero',
            registro_id: nuevo.id,
            detalles: JSON.stringify({ nuevoProyecto: nuevo })
          }
        });

        return nuevo;
      });

      return NextResponse.json({ success: true, proyecto });
    }

    // ─── REALIZAR TRANSFERENCIA INTERBANCARIA ──────────────────────────
    if (action === 'transferir') {
      const { origen_id, destino_id, monto } = data ?? {};

      if (!origen_id || !destino_id || !monto || Number(monto) <= 0) {
        return NextResponse.json({ error: 'Campos requeridos: origen_id, destino_id, monto positivo' }, { status: 400 });
      }

      const transfer = await prisma.$transaction(async (tx) => {
        const origen = await tx.cuentaBancaria.findUnique({ where: { id: origen_id } });
        const destino = await tx.cuentaBancaria.findUnique({ where: { id: destino_id } });

        if (!origen || !destino || origen.iglesia_id !== iglesiaId || destino.iglesia_id !== iglesiaId) {
          throw new Error('Cuentas no encontradas o acceso denegado');
        }

        if (origen.balance < Number(monto)) {
          throw new Error('Fondos insuficientes en la cuenta de origen');
        }

        // Deduct
        const newOrigen = await tx.cuentaBancaria.update({
          where: { id: origen_id },
          data: { balance: { decrement: Number(monto) } }
        });

        // Add
        const newDestino = await tx.cuentaBancaria.update({
          where: { id: destino_id },
          data: { balance: { increment: Number(monto) } }
        });

        // Audit log
        await tx.auditoriaFinanciera.create({
          data: {
            iglesia_id: iglesiaId,
            usuario_id: user.id,
            usuario_nombre: userDisplayName,
            accion: 'TRANSFERENCIA',
            tabla_afectada: 'CuentaBancaria',
            registro_id: origen_id,
            detalles: JSON.stringify({
              origen_banco: origen.nombre_banco,
              destino_banco: destino.nombre_banco,
              monto: Number(monto),
              balanceOrigenAnterior: origen.balance,
              balanceOrigenNuevo: newOrigen.balance,
              balanceDestinoAnterior: destino.balance,
              balanceDestinoNuevo: newDestino.balance
            })
          }
        });

        return { origen: newOrigen, destino: newDestino };
      });

      return NextResponse.json({ success: true, transfer });
    }

    return NextResponse.json({ error: 'Acción desconocida' }, { status: 400 });

  } catch (error: any) {
    console.error('[POST /api/finanzas/caja-bancos]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
