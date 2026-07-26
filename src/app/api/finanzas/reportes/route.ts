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
    const usuario = await resolveAuthorizedUser(iglesiaId);
    if (!usuario) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const fuente = searchParams.get('fuente'); // TODAS, DIEZMOS, o UUID de cuenta
    const fechaInicioStr = searchParams.get('fechaInicio');
    const fechaFinStr = searchParams.get('fechaFin');
    
    let whereClause: any = { iglesia_id: iglesiaId };
    
    if (fechaInicioStr && fechaFinStr) {
      // Ensure we include the whole day for fechaFin
      const startDate = new Date(fechaInicioStr + 'T00:00:00');
      const endDate = new Date(fechaFinStr + 'T23:59:59');
      whereClause.fecha = { gte: startDate, lte: endDate };
    }

    let transacciones: any[] = [];
    let diezmos: any[] = [];

    if (fuente === 'TODAS' || fuente === 'DIEZMOS') {
      diezmos = await prisma.historialDiezmo.findMany({
        where: whereClause,
        include: { persona: { select: { nombre: true } } },
        orderBy: { fecha: 'desc' }
      });
    }

    if (fuente === 'TODAS' || (fuente && fuente !== 'TODAS' && fuente !== 'DIEZMOS')) {
      let tWhere = { ...whereClause };
      if (fuente !== 'TODAS') {
        tWhere.cuenta_fondo_id = fuente;
      }
      transacciones = await prisma.transaccionFinanciera.findMany({
        where: tWhere,
        include: {
          cuenta_fondo: { select: { nombre: true, tipo: true } }
        },
        orderBy: { fecha: 'desc' }
      });
    }

    return NextResponse.json({ transacciones, diezmos });
    
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
