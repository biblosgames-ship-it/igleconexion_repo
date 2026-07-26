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

    const now = new Date();
    
    // Start of Today
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Start of Week (Sunday)
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    
    // Start of Month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Start of Year
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // Fetch all active transactions for this church
    const transactions = await prisma.transaccionFinanciera.findMany({
      where: { 
        iglesia_id: iglesiaId,
        estado: { not: "ANULADO" }
      }
    });

    // ─── KPI METRICS ──────────────────────────────────────────────────
    let totalReceivedToday = 0;
    let totalReceivedWeek = 0;
    let totalReceivedMonth = 0;
    let totalReceivedYear = 0;

    let totalDiezmos = 0;
    let totalOfrendas = 0;
    let totalDonaciones = 0;
    let totalIngresos = 0;
    let totalGastos = 0;

    const paymentMethods: Record<string, number> = {
      EFECTIVO: 0,
      TRANSFERENCIA: 0,
      TARJETA: 0,
      CHEQUE: 0,
      OTRO: 0
    };

    transactions.forEach(t => {
      const tDate = new Date(t.fecha);
      const isIngreso = t.tipo === 'INGRESO';

      // Time aggregates
      if (isIngreso) {
        if (tDate >= startOfToday) totalReceivedToday += t.monto;
        if (tDate >= startOfWeek) totalReceivedWeek += t.monto;
        if (tDate >= startOfMonth) totalReceivedMonth += t.monto;
        if (tDate >= startOfYear) totalReceivedYear += t.monto;
      }

      // Classification aggregates
      if (isIngreso) {
        totalIngresos += t.monto;
        if (t.clasificacion === 'DIEZMO') {
          totalDiezmos += t.monto;
        } else if (t.clasificacion === 'OFRENDA') {
          totalOfrendas += t.monto;
        } else if (t.clasificacion === 'DONACION') {
          totalDonaciones += t.monto;
        }
      } else {
        totalGastos += t.monto;
      }

      // Payment method breakdown
      const method = t.metodo_pago ? t.metodo_pago.toUpperCase() : 'EFECTIVO';
      if (paymentMethods[method] !== undefined) {
        paymentMethods[method] += t.monto;
      } else {
        paymentMethods.OTRO += t.monto;
      }
    });

    const saldoDisponible = totalIngresos - totalGastos;

    // ─── ACCOUNTS & PETTY CASH ───────────────────────────────────────
    const cuentas = await prisma.cuentaBancaria.findMany({
      where: { iglesia_id: iglesiaId }
    });
    const totalBancos = cuentas.reduce((sum, c) => sum + c.balance, 0);

    const cajas = await prisma.cajaChica.findMany({
      where: { iglesia_id: iglesiaId }
    });
    const totalCajaChica = cajas.reduce((sum, c) => sum + c.balance, 0);

    // ─── BUDGETS & PROJECTS ──────────────────────────────────────────
    const proyectos = await prisma.proyectoFinanciero.findMany({
      where: { iglesia_id: iglesiaId }
    });

    const presupuestos = await prisma.presupuesto.findMany({
      where: { iglesia_id: iglesiaId, anio: now.getFullYear() }
    });
    const totalPresupuestoAsignado = presupuestos.reduce((sum, p) => sum + p.monto_asignado, 0);
    const totalPresupuestoEjecutado = presupuestos.reduce((sum, p) => sum + p.monto_ejecutado, 0);

    // ─── HISTORICAL DATA FOR CHARTS (Last 6 Months) ───────────────────
    const monthlyData: Record<string, { mes: string; ingresos: number; gastos: number }> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[key] = { mes: key, ingresos: 0, gastos: 0 };
    }

    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    transactions.forEach(t => {
      const tDate = new Date(t.fecha);
      if (tDate >= sixMonthsAgo) {
        const key = `${tDate.getFullYear()}-${String(tDate.getMonth() + 1).padStart(2, '0')}`;
        if (monthlyData[key]) {
          if (t.tipo === 'INGRESO') {
            monthlyData[key].ingresos += t.monto;
          } else if (t.tipo === 'EGRESO') {
            monthlyData[key].gastos += t.monto;
          }
        }
      }
    });

    const chartData = Object.values(monthlyData);

    return NextResponse.json({
      resumen: {
        hoy: totalReceivedToday,
        semana: totalReceivedWeek,
        mes: totalReceivedMonth,
        anio: totalReceivedYear
      },
      kpi: {
        diezmos: totalDiezmos,
        ofrendas: totalOfrendas,
        donaciones: totalDonaciones,
        otrosIngresos: totalIngresos - (totalDiezmos + totalOfrendas + totalDonaciones),
        gastos: totalGastos,
        saldo: saldoDisponible,
        bancos: totalBancos,
        cajaChica: totalCajaChica,
        presupuestoEjecutado: totalPresupuestoEjecutado,
        presupuestoAsignado: totalPresupuestoAsignado
      },
      paymentMethods,
      chartData,
      proyectos,
      cuentas,
      cajas
    });

  } catch (error: any) {
    console.error('[GET /api/finanzas/dashboard]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
