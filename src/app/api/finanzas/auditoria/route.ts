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

    const logs = await prisma.auditoriaFinanciera.findMany({
      where: { iglesia_id: iglesiaId },
      orderBy: { createdAt: 'desc' },
      take: 200 // Cap at 200 logs for efficiency
    });

    return NextResponse.json(logs);

  } catch (error: any) {
    console.error('[GET /api/finanzas/auditoria]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
