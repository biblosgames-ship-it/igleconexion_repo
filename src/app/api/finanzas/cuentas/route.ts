import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getActiveChurchId, getSessionUserId } from '@/lib/active-church';

const ALLOWED_ROLES = ['SUPERADMIN', 'TESORERO', 'ADMIN_IGLESIA'];

async function resolveAuthorizedUser(iglesiaId: string) {
  const userId = await getSessionUserId();
  if (!userId) return null;
  const usuario = await prisma.usuario.findUnique({ where: { id: userId } });
  if (!usuario) return null;
  if (!ALLOWED_ROLES.includes(usuario.rol)) return null;
  if (usuario.rol !== 'SUPERADMIN' && usuario.iglesia_id !== iglesiaId) return null;
  return usuario;
}

export async function GET(request: Request) {
  try {
    const iglesiaId = await getActiveChurchId();
    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get('tipo'); // OFRENDA, GASTO, DEPARTAMENTO, CAJA_CHICA, CAJA_GENERAL, BANCO

    // Garantizar que las 3 cuentas principales existan
    const defaultCuentas = [
      { nombre: 'Caja Chica', tipo: 'CAJA_CHICA', descripcion: 'Entradas diarias y egresos menores' },
      { nombre: 'Caja General', tipo: 'CAJA_GENERAL', descripcion: 'Fondo consolidado de caja central' },
      { nombre: 'Caja de Banco', tipo: 'BANCO', descripcion: 'Cuenta bancaria para depósitos y transferencias' },
    ];

    for (const def of defaultCuentas) {
      const exists = await prisma.cuentaFondo.findFirst({
        where: { iglesia_id: iglesiaId, nombre: def.nombre }
      });
      if (!exists) {
        await prisma.cuentaFondo.create({
          data: {
            iglesia_id: iglesiaId,
            nombre: def.nombre,
            tipo: def.tipo,
            descripcion: def.descripcion,
            balance: 0.0
          }
        });
      }
    }

    const whereClause: any = { iglesia_id: iglesiaId };
    if (tipo) whereClause.tipo = tipo;

    const cuentas = await prisma.cuentaFondo.findMany({
      where: whereClause,
      include: {
        transacciones: {
          orderBy: { fecha: 'desc' },
          take: 5
        }
      }
    });
    return NextResponse.json(cuentas);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const iglesiaId = await getActiveChurchId();
    const usuario = await resolveAuthorizedUser(iglesiaId);
    if (!usuario) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const body = await request.json();
    const { action, data } = body;

    if (action === 'crear_cuenta') {
      const nueva = await prisma.cuentaFondo.create({
        data: {
          iglesia_id: iglesiaId,
          nombre: data.nombre,
          tipo: data.tipo,
          descripcion: data.descripcion,
          balance: data.balanceInicial || 0
        }
      });
      return NextResponse.json(nueva);
    }
    
    if (action === 'editar_cuenta') {
      const { id, nombre, descripcion } = data;
      const actualizada = await prisma.cuentaFondo.update({
        where: { id },
        data: { nombre, descripcion }
      });
      return NextResponse.json(actualizada);
    }

    if (action === 'transferir_fondos') {
      const { cuenta_origen_id, cuenta_destino_id, monto, fecha, descripcion } = data;
      if (!cuenta_origen_id || !cuenta_destino_id || !monto || parseFloat(monto) <= 0) {
        throw new Error("Monto o cuentas de transferencia inválidas");
      }
      if (cuenta_origen_id === cuenta_destino_id) {
        throw new Error("La cuenta origen y destino deben ser distintas");
      }

      const origen = await prisma.cuentaFondo.findUnique({ where: { id: cuenta_origen_id } });
      const destino = await prisma.cuentaFondo.findUnique({ where: { id: cuenta_destino_id } });
      if (!origen || !destino) throw new Error("Cuentas no encontradas");

      const fechaMov = fecha ? new Date(fecha) : new Date();
      const numMonto = parseFloat(monto);

      await prisma.$transaction([
        prisma.transaccionFinanciera.create({
          data: {
            iglesia_id: iglesiaId,
            cuenta_fondo_id: cuenta_origen_id,
            tipo: 'EGRESO',
            monto: numMonto,
            descripcion: `Transferencia hacia ${destino.nombre}: ${descripcion || 'Traslado de fondos'}`,
            fecha: fechaMov,
            categoria: 'TRANSFERENCIA',
            clasificacion: 'OTRO',
            metodo_pago: origen.tipo === 'BANCO' ? 'TRANSFERENCIA' : 'EFECTIVO',
            registrado_por: usuario.id,
            usuario_creo_id: usuario.id
          }
        }),
        prisma.transaccionFinanciera.create({
          data: {
            iglesia_id: iglesiaId,
            cuenta_fondo_id: cuenta_destino_id,
            tipo: 'INGRESO',
            monto: numMonto,
            descripcion: `Transferencia desde ${origen.nombre}: ${descripcion || 'Traslado de fondos'}`,
            fecha: fechaMov,
            categoria: 'TRANSFERENCIA',
            clasificacion: 'OTRO',
            metodo_pago: destino.tipo === 'BANCO' ? 'TRANSFERENCIA' : 'EFECTIVO',
            registrado_por: usuario.id,
            usuario_creo_id: usuario.id
          }
        }),
        prisma.cuentaFondo.update({
          where: { id: cuenta_origen_id },
          data: { balance: origen.balance - numMonto }
        }),
        prisma.cuentaFondo.update({
          where: { id: cuenta_destino_id },
          data: { balance: destino.balance + numMonto }
        })
      ]);

      return NextResponse.json({ success: true });
    }

    if (action === 'registrar_transaccion') {
      const { cuenta_fondo_id, tipo, monto, descripcion, fecha, categoria, clasificacion, metodo_pago } = data;
      
      // Update balance
      const cuenta = await prisma.cuentaFondo.findUnique({ where: { id: cuenta_fondo_id } });
      if (!cuenta) throw new Error("Cuenta no encontrada");

      const nuevoBalance = tipo === 'INGRESO' ? cuenta.balance + monto : cuenta.balance - monto;
      
      const transaccion = await prisma.$transaction([
        prisma.transaccionFinanciera.create({
          data: {
            iglesia_id: iglesiaId,
            cuenta_fondo_id,
            tipo,
            monto,
            descripcion,
            fecha: new Date(fecha),
            categoria: categoria || 'OTRO',
            clasificacion: clasificacion || 'OTRO',
            metodo_pago: metodo_pago || 'EFECTIVO',
            registrado_por: usuario.id, // we save user ID instead of name for better traceability
            usuario_creo_id: usuario.id
          }
        }),
        prisma.cuentaFondo.update({
          where: { id: cuenta_fondo_id },
          data: { balance: nuevoBalance }
        })
      ]);

      return NextResponse.json(transaccion);
    }

    if (action === 'eliminar_transaccion') {
      const { id } = data;
      
      const transaccion = await prisma.transaccionFinanciera.findUnique({
        where: { id },
        include: { cuenta_fondo: true }
      });

      if (!transaccion) throw new Error("Transacción no encontrada");

      // Revert the balance
      const cuenta = transaccion.cuenta_fondo;
      if (!cuenta) throw new Error("Cuenta asociada no encontrada");
      const nuevoBalance = transaccion.tipo === 'INGRESO' 
        ? cuenta.balance - transaccion.monto 
        : cuenta.balance + transaccion.monto;

      await prisma.$transaction([
        prisma.cuentaFondo.update({
          where: { id: cuenta.id },
          data: { balance: nuevoBalance }
        }),
        prisma.transaccionFinanciera.delete({
          where: { id }
        })
      ]);

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
