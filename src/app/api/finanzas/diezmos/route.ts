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
    const { persona_id, monto, fecha, metodo_pago, cuenta_fondo_id } = body;

    // Determinar la cuenta a acreditar
    let targetCuentaId = cuenta_fondo_id;
    if (!targetCuentaId) {
      if (metodo_pago === 'TRANSFERENCIA') {
        const banco = await prisma.cuentaFondo.findFirst({
          where: { iglesia_id: iglesiaId, OR: [{ tipo: 'BANCO' }, { nombre: { contains: 'Banco', mode: 'insensitive' } }] }
        });
        targetCuentaId = banco?.id;
      } else {
        const chica = await prisma.cuentaFondo.findFirst({
          where: { iglesia_id: iglesiaId, OR: [{ tipo: 'CAJA_CHICA' }, { nombre: { contains: 'Chica', mode: 'insensitive' } }] }
        });
        targetCuentaId = chica?.id;
      }
    }

    const numMonto = parseFloat(monto);
    const fechaDiezmo = new Date(fecha);

    const [diezmo] = await prisma.$transaction([
      prisma.historialDiezmo.create({
        data: {
          iglesia_id: iglesiaId,
          persona_id,
          monto: numMonto,
          fecha: fechaDiezmo,
          metodo_pago: metodo_pago || 'EFECTIVO',
          registrado_por: usuario.id
        },
        include: {
          persona: { select: { nombre: true, foto_url: true } }
        }
      }),
      ...(targetCuentaId ? [
        prisma.transaccionFinanciera.create({
          data: {
            iglesia_id: iglesiaId,
            cuenta_fondo_id: targetCuentaId,
            tipo: 'INGRESO',
            monto: numMonto,
            descripcion: `Diezmo registrado`,
            fecha: fechaDiezmo,
            categoria: 'DIEZMO',
            clasificacion: 'DIEZMO',
            metodo_pago: metodo_pago || 'EFECTIVO',
            registrado_por: usuario.id,
            usuario_creo_id: usuario.id,
            miembro_id: persona_id
          }
        }),
        prisma.cuentaFondo.update({
          where: { id: targetCuentaId },
          data: { balance: { increment: numMonto } }
        })
      ] : [])
    ]);

    return NextResponse.json(diezmo);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
