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
    const categoria = searchParams.get('categoria') || '';
    const estado = searchParams.get('estado') || '';

    // Build query filters
    const whereClause: any = {
      iglesia_id: iglesiaId,
      tipo: 'EGRESO'
    };

    if (categoria) {
      whereClause.categoria = categoria;
    }
    
    if (estado) {
      whereClause.estado = estado;
    }

    if (search) {
      whereClause.OR = [
        { descripcion: { contains: search } },
        { registrado_por: { contains: search } },
        { proveedor: { contains: search } },
        { centro_costo: { contains: search } }
      ];
    }

    const transacciones = await prisma.transaccionFinanciera.findMany({
      where: whereClause,
      orderBy: { fecha: 'desc' }
    });

    // Enrich manual details
    const bankIds = Array.from(new Set(transacciones.map(t => t.banco_id).filter(Boolean))) as string[];
    const projectIds = Array.from(new Set(transacciones.map(t => t.proyecto_id).filter(Boolean))) as string[];
    const conceptoIds = Array.from(new Set(transacciones.map(t => t.concepto_id).filter(Boolean))) as string[];

    const cuentas = await prisma.cuentaBancaria.findMany({
      where: { id: { in: bankIds } }
    });

    const proyectos = await prisma.proyectoFinanciero.findMany({
      where: { id: { in: projectIds } }
    });

    const conceptos = await prisma.conceptoFinanciero.findMany({
      where: { id: { in: conceptoIds } }
    });

    const cuentasMap = new Map(cuentas.map(c => [c.id, c]));
    const proyectosMap = new Map(proyectos.map(p => [p.id, p]));
    const conceptosMap = new Map(conceptos.map(c => [c.id, c]));

    const enriched = transacciones.map(t => {
      const cuenta = t.banco_id ? cuentasMap.get(t.banco_id) : null;
      const proyecto = t.proyecto_id ? proyectosMap.get(t.proyecto_id) : null;
      const concepto = t.concepto_id ? conceptosMap.get(t.concepto_id) : null;
      return {
        ...t,
        bancoNombre: cuenta?.nombre_banco ?? 'Efectivo / Caja',
        proyectoNombre: proyecto?.nombre ?? 'Gasto General',
        conceptoNombre: concepto?.nombre ?? t.categoria
      };
    });

    return NextResponse.json(enriched);

  } catch (error: any) {
    console.error('[GET /api/finanzas/gastos]', error);
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
        categoria,
        monto,
        fecha,
        metodo_pago,
        descripcion,
        banco_id,
        caja_chica_id,
        proyecto_id,
        comprobante_url,
        factura_no,
        proveedor,
        departamento,
        ministerio,
        centro_costo,
        concepto_id
      } = data ?? {};

      if (!categoria || monto == null || !fecha || !metodo_pago) {
        return NextResponse.json({ error: 'Campos requeridos: categoria, monto, fecha, metodo_pago' }, { status: 400 });
      }

      const result = await prisma.$transaction(async (tx) => {
        // 1. Create transaction egreso
        const transaccion = await tx.transaccionFinanciera.create({
          data: {
            iglesia_id: iglesiaId,
            tipo: 'EGRESO',
            clasificacion: 'GASTO',
            categoria,
            monto: Number(monto),
            fecha: new Date(fecha),
            metodo_pago,
            descripcion: descripcion || '',
            registrado_por: userDisplayName,
            estado: 'PAGADO',
            banco_id: banco_id || null,
            caja_chica_id: caja_chica_id || null,
            proyecto_id: proyecto_id || null,
            comprobante_url: comprobante_url || null,
            factura_no: factura_no || null,
            proveedor: proveedor || null,
            departamento: departamento || null,
            ministerio: ministerio || null,
            centro_costo: centro_costo || null,
            concepto_id: concepto_id || null,
            usuario_creo_id: user.id
          }
        });

        // 2. Adjust account balance (deduct)
        if (metodo_pago.toUpperCase() === 'TRANSFERENCIA' && banco_id) {
          await tx.cuentaBancaria.update({
            where: { id: banco_id },
            data: { balance: { decrement: Number(monto) } }
          });
        } else if (metodo_pago.toUpperCase() === 'EFECTIVO' && caja_chica_id) {
          await tx.cajaChica.update({
            where: { id: caja_chica_id },
            data: { balance: { decrement: Number(monto) } }
          });
        }

        // 3. Adjust project spendings if associated
        if (proyecto_id) {
          await tx.proyectoFinanciero.update({
            where: { id: proyecto_id },
            data: { gastado: { increment: Number(monto) } }
          });
        }

        // 4. Adjust budget executed amount if applicable
        const budgetYear = new Date(fecha).getFullYear();
        const activeBudget = await tx.presupuesto.findFirst({
          where: {
            iglesia_id: iglesiaId,
            anio: budgetYear,
            OR: [
              { ministerio: ministerio || undefined },
              { departamento: departamento || undefined },
              { proyecto_id: proyecto_id || undefined }
            ]
          }
        });

        if (activeBudget) {
          await tx.presupuesto.update({
            where: { id: activeBudget.id },
            data: { monto_ejecutado: { increment: Number(monto) } }
          });
        }

        // 5. Log audit
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

        // Revert bank/caja balances (refund)
        if (existing.metodo_pago.toUpperCase() === 'TRANSFERENCIA' && existing.banco_id) {
          await tx.cuentaBancaria.update({
            where: { id: existing.banco_id },
            data: { balance: { increment: existing.monto } }
          });
        } else if (existing.metodo_pago.toUpperCase() === 'EFECTIVO' && existing.caja_chica_id) {
          await tx.cajaChica.update({
            where: { id: existing.caja_chica_id },
            data: { balance: { increment: existing.monto } }
          });
        }

        // Revert project spendings
        if (existing.proyecto_id) {
          await tx.proyectoFinanciero.update({
            where: { id: existing.proyecto_id },
            data: { gastado: { decrement: existing.monto } }
          });
        }

        // Revert budget executed
        const budgetYear = new Date(existing.fecha).getFullYear();
        const activeBudget = await tx.presupuesto.findFirst({
          where: {
            iglesia_id: iglesiaId,
            anio: budgetYear,
            OR: [
              { ministerio: existing.ministerio || undefined },
              { departamento: existing.departamento || undefined },
              { proyecto_id: existing.proyecto_id || undefined }
            ]
          }
        });

        if (activeBudget) {
          await tx.presupuesto.update({
            where: { id: activeBudget.id },
            data: { monto_ejecutado: { decrement: existing.monto } }
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
    console.error('[POST /api/finanzas/gastos]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
