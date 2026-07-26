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
    
    // Podemos recibir persona_id para ver historial de uno solo
    const { searchParams } = new URL(request.url);
    const personaId = searchParams.get('persona_id');

    const whereClause: any = { iglesia_id: iglesiaId };
    if (personaId) whereClause.persona_id = personaId;

    const diezmos = await prisma.historialDiezmo.findMany({
      where: whereClause,
      include: {
        persona: { select: { nombre: true, foto_url: true } }
      },
      orderBy: { fecha: 'desc' },
      take: 50 // limitamos para no colgar
    });
    return NextResponse.json(diezmos);
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
    const { persona_id, monto, fecha, metodo_pago } = body;

    const diezmo = await prisma.historialDiezmo.create({
      data: {
        iglesia_id: iglesiaId,
        persona_id,
        monto: parseFloat(monto),
        fecha: new Date(fecha),
        metodo_pago: metodo_pago || 'EFECTIVO',
        registrado_por: usuario.id
      },
      include: {
        persona: { select: { nombre: true, foto_url: true } }
      }
    });

    return NextResponse.json(diezmo);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
