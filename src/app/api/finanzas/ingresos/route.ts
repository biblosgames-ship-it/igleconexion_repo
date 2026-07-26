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

export async function GET(request: Request) {
  try {
    const iglesiaId = await getActiveChurchId();
    const user = await resolveAuthorizedUser(iglesiaId);
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const clasificacion = searchParams.get('clasificacion') || ''; // DIEZMO, OFRENDA, etc.
    const method = searchParams.get('metodo_pago') || '';

    // Build filter query
    const whereClause: any = {
      iglesia_id: iglesiaId,
      tipo: 'INGRESO'
    };

    if (clasificacion) {
      whereClause.clasificacion = clasificacion;
    }
    
    if (method) {
      whereClause.metodo_pago = method;
    }

    if (search) {
      whereClause.OR = [
        { descripcion: { contains: search } },
        { registrado_por: { contains: search } },
        { proveedor: { contains: search } }
      ];
    }

    const transacciones = await prisma.transaccionFinanciera.findMany({
      where: whereClause,
      orderBy: { fecha: 'desc' }
    });

    // Enrich with members and bank info manually to avoid complex joins in SQLite
    const memberIds = Array.from(new Set(transacciones.map(t => t.miembro_id).filter(Boolean))) as string[];
    const bankIds = Array.from(new Set(transacciones.map(t => t.banco_id).filter(Boolean))) as string[];
    const conceptoIds = Array.from(new Set(transacciones.map(t => t.concepto_id).filter(Boolean))) as string[];
 
    const miembros = await prisma.persona.findMany({
      where: { id: { in: memberIds } },
      select: { id: true, nombre: true }
    });
 
    const cuentas = await prisma.cuentaBancaria.findMany({
      where: { id: { in: bankIds } }
    });

    const conceptos = await prisma.conceptoFinanciero.findMany({
      where: { id: { in: conceptoIds } }
    });
 
    const miembrosMap = new Map(miembros.map(m => [m.id, m]));
    const cuentasMap = new Map(cuentas.map(c => [c.id, c]));
    const conceptosMap = new Map(conceptos.map(c => [c.id, c]));
 
    const enriched = transacciones.map(t => {
      const miembro = t.miembro_id ? miembrosMap.get(t.miembro_id) : null;
      const cuenta = t.banco_id ? cuentasMap.get(t.banco_id) : null;
      const concepto = t.concepto_id ? conceptosMap.get(t.concepto_id) : null;
      return {
        ...t,
        miembroNombre: miembro?.nombre ?? 'Anónimo / Otro',
        bancoNombre: cuenta?.nombre_banco ?? 'Efectivo / Caja',
        conceptoNombre: concepto?.nombre ?? t.clasificacion
      };
    });

    return NextResponse.json(enriched);

  } catch (error: any) {
    console.error('[GET /api/finanzas/ingresos]', error);
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

    // ─── ACTION: CREAR ────────────────────────────────────────────────
    if (action === 'crear') {
      const {
        clasificacion,
        categoria,
        monto,
        fecha,
        metodo_pago,
        descripcion,
        miembro_id,
        banco_id,
        caja_chica_id,
        proyecto_id,
        comprobante_url,
        factura_no,
        concepto_id
      } = data ?? {};

      if (!clasificacion || !categoria || monto == null || !fecha || !metodo_pago) {
        return NextResponse.json({ error: 'Campos requeridos: clasificacion, categoria, monto, fecha, metodo_pago' }, { status: 400 });
      }

      // Execute in transactional block to keep DB in sync
      const result = await prisma.$transaction(async (tx) => {
        // 1. Create financial transaction
        const transaccion = await tx.transaccionFinanciera.create({
          data: {
            iglesia_id: iglesiaId,
            tipo: 'INGRESO',
            clasificacion,
            categoria,
            monto: Number(monto),
            fecha: new Date(fecha),
            metodo_pago,
            descripcion: descripcion || '',
            registrado_por: userDisplayName,
            estado: 'PAGADO',
            miembro_id: miembro_id || null,
            banco_id: banco_id || null,
            caja_chica_id: caja_chica_id || null,
            proyecto_id: proyecto_id || null,
            concepto_id: concepto_id || null,
            comprobante_url: comprobante_url || null,
            factura_no: factura_no || null,
            usuario_creo_id: user.id
          }
        });

        // 2. Adjust account balance
        if (metodo_pago.toUpperCase() === 'TRANSFERENCIA' && banco_id) {
          await tx.cuentaBancaria.update({
            where: { id: banco_id },
            data: { balance: { increment: Number(monto) } }
          });
        } else if (metodo_pago.toUpperCase() === 'EFECTIVO' && caja_chica_id) {
          await tx.cajaChica.update({
            where: { id: caja_chica_id },
            data: { balance: { increment: Number(monto) } }
          });
        }

        // 3. Adjust project progress if associated
        if (proyecto_id) {
          await tx.proyectoFinanciero.update({
            where: { id: proyecto_id },
            data: { recaudado: { increment: Number(monto) } }
          });
        }

        // 4. Log audit entry
        await tx.auditoriaFinanciera.create({
          data: {
            iglesia_id: iglesiaId,
            usuario_id: user.id,
            usuario_nombre: userDisplayName,
            accion: 'CREAR',
            tabla_afectada: 'TransaccionFinanciera',
            registro_id: transaccion.id,
            detalles: JSON.stringify({ nuevoRegistro: transaccion })
          }
        });

        return transaccion;
      });

      return NextResponse.json({ success: true, transaccion: result });
    }

    // ─── ACTION: ANULAR ───────────────────────────────────────────────
    if (action === 'anular') {
      const { id } = data ?? {};
      if (!id) {
        return NextResponse.json({ error: 'ID es requerido para anular' }, { status: 400 });
      }

      const result = await prisma.$transaction(async (tx) => {
        const existing = await tx.transaccionFinanciera.findUnique({
          where: { id }
        });

        if (!existing || existing.iglesia_id !== iglesiaId) {
          throw new Error('Transacción no encontrada o acceso denegado');
        }

        if (existing.estado === 'ANULADO') {
          throw new Error('La transacción ya se encuentra anulada');
        }

        // Update state to ANULADO
        const transaccion = await tx.transaccionFinanciera.update({
          where: { id },
          data: { estado: 'ANULADO' }
        });

        // Revert bank/caja balances
        if (existing.metodo_pago.toUpperCase() === 'TRANSFERENCIA' && existing.banco_id) {
          await tx.cuentaBancaria.update({
            where: { id: existing.banco_id },
            data: { balance: { decrement: existing.monto } }
          });
        } else if (existing.metodo_pago.toUpperCase() === 'EFECTIVO' && existing.caja_chica_id) {
          await tx.cajaChica.update({
            where: { id: existing.caja_chica_id },
            data: { balance: { decrement: existing.monto } }
          });
        }

        // Revert project stats if linked
        if (existing.proyecto_id) {
          await tx.proyectoFinanciero.update({
            where: { id: existing.proyecto_id },
            data: { recaudado: { decrement: existing.monto } }
          });
        }

        // Write Audit Log
        await tx.auditoriaFinanciera.create({
          data: {
            iglesia_id: iglesiaId,
            usuario_id: user.id,
            usuario_nombre: userDisplayName,
            accion: 'ANULAR',
            tabla_afectada: 'TransaccionFinanciera',
            registro_id: existing.id,
            detalles: JSON.stringify({ antes: existing, despues: transaccion })
          }
        });

        return transaccion;
      });

      return NextResponse.json({ success: true, transaccion: result });
    }

    return NextResponse.json({ error: 'Acción desconocida' }, { status: 400 });

  } catch (error: any) {
    console.error('[POST /api/finanzas/ingresos]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
