import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getActiveChurchId, getSessionUserId } from '@/lib/active-church';

const ALLOWED_ROLES = ['SUPERADMIN', 'TESORERO'];

async function resolveAuthorizedUser(iglesiaId: string) {
  const userId = await getSessionUserId();
  if (!userId) return null;

  const usuario = await prisma.usuario.findUnique({
    where: { id: userId },
    select: { rol: true, iglesia_id: true },
  });

  if (!usuario) return null;
  // Si es ADMIN_IGLESIA, solo puede ver el dashboard (GET), pero limitaremos las acciones de POST/PUT
  if (!ALLOWED_ROLES.includes(usuario.rol) && usuario.rol !== 'ADMIN_IGLESIA') return null;
  
  if (usuario.rol !== 'SUPERADMIN' && usuario.iglesia_id !== iglesiaId) return null;

  return usuario;
}

export async function GET(request: Request) {
  try {
    const iglesiaId = await getActiveChurchId();
    const usuario = await resolveAuthorizedUser(iglesiaId);
    
    if (!usuario) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const periodo = searchParams.get('periodo');

    // Calcular fechas inicio y fin según el periodo
    let start = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    let end = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1);
    
    if (periodo) {
      if (periodo.includes('-Q')) {
        const year = parseInt(periodo.split('-')[0]);
        const q = parseInt(periodo.split('Q')[1]);
        start = new Date(year, (q - 1) * 3, 1);
        end = new Date(year, q * 3, 1);
      } else if (periodo.includes('-S')) {
        const year = parseInt(periodo.split('-')[0]);
        const s = parseInt(periodo.split('S')[1]);
        start = new Date(year, (s - 1) * 6, 1);
        end = new Date(year, s * 6, 1);
      } else if (periodo.includes('-')) {
        const [year, month] = periodo.split('-');
        start = new Date(parseInt(year), parseInt(month) - 1, 1);
        end = new Date(parseInt(year), parseInt(month), 1);
      } else {
        start = new Date(parseInt(periodo), 0, 1);
        end = new Date(parseInt(periodo) + 1, 0, 1);
      }
    }

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

    // Queries en paralelo
    const [cuentas, transaccionesPeriodo, diezmosPeriodo, transaccionesRecientes, iglesia] = await Promise.all([
      prisma.cuentaFondo.findMany({ where: { iglesia_id: iglesiaId } }),
      prisma.transaccionFinanciera.findMany({
        where: { iglesia_id: iglesiaId, fecha: { gte: start, lt: end }, estado: 'PAGADO' },
        include: { cuenta_fondo: { select: { nombre: true, tipo: true } } }
      }),
      prisma.historialDiezmo.findMany({ where: { iglesia_id: iglesiaId, fecha: { gte: start, lt: end } } }),
      prisma.transaccionFinanciera.findMany({
        where: { iglesia_id: iglesiaId },
        orderBy: { fecha: 'desc' },
        take: 10,
        include: { cuenta_fondo: { select: { nombre: true } } }
      }),
      prisma.iglesia.findUnique({
        where: { id: iglesiaId },
        select: { nombre_iglesia: true, contacto_direccion: true, contacto_telefono: true, logo_url: true }
      }),
    ]);

    const balanceCuentas = cuentas.reduce((acc, c) => acc + c.balance, 0);
    const ingresosPeriodo = transaccionesPeriodo.filter(t => t.tipo === 'INGRESO').reduce((a, b) => a + b.monto, 0);
    const egresosPeriodo = transaccionesPeriodo.filter(t => t.tipo === 'EGRESO').reduce((a, b) => a + b.monto, 0);
    const totalDiezmosPeriodo = diezmosPeriodo.reduce((a, b) => a + b.monto, 0);

    return NextResponse.json({
      iglesia,
      balanceGeneral: balanceCuentas,
      ingresosMes: ingresosPeriodo + totalDiezmosPeriodo, // Cambiamos el nombre de variable pero mantenemos compatibilidad
      egresosMes: egresosPeriodo,
      cuentas,
      transaccionesRecientes,
      transaccionesPeriodo,
      diezmosPeriodo,
      rol: usuario.rol
    });

  } catch (error: any) {
    console.error('Error GET /api/finanzas:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
