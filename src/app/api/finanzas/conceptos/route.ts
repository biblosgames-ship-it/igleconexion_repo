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

    const conceptos = await prisma.conceptoFinanciero.findMany({
      where: { iglesia_id: iglesiaId },
      orderBy: { nombre: 'asc' }
    });

    return NextResponse.json(conceptos);

  } catch (error: any) {
    console.error('[GET /api/finanzas/conceptos]', error);
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

    if (!action) {
      return NextResponse.json({ error: 'Falta la acción' }, { status: 400 });
    }

    // ── action: crear ────────────────────────────────────────────────────────
    if (action === 'crear') {
      const { tipo, nombre, descripcion } = data || {};

      if (!tipo || !nombre) {
        return NextResponse.json({ error: 'Tipo (INGRESO/GASTO) y nombre son requeridos.' }, { status: 400 });
      }

      if (tipo !== 'INGRESO' && tipo !== 'GASTO') {
        return NextResponse.json({ error: 'El tipo debe ser INGRESO o GASTO.' }, { status: 400 });
      }

      // Check duplicate
      const duplicated = await prisma.conceptoFinanciero.findFirst({
        where: {
          iglesia_id: iglesiaId,
          tipo,
          nombre: {
            equals: nombre,
          }
        }
      });

      if (duplicated) {
        return NextResponse.json({ error: 'Ya existe un concepto con este nombre y tipo.' }, { status: 400 });
      }

      const nuevoConcepto = await prisma.conceptoFinanciero.create({
        data: {
          iglesia_id: iglesiaId,
          tipo,
          nombre,
          descripcion: descripcion || null
        }
      });

      // Registrar auditoría
      await prisma.auditoriaFinanciera.create({
        data: {
          iglesia_id: iglesiaId,
          usuario_id: user.id,
          usuario_nombre: user.persona?.nombre || user.email.split('@')[0],
          accion: 'CREAR',
          tabla_afectada: 'ConceptoFinanciero',
          registro_id: nuevoConcepto.id,
          detalles: JSON.stringify({ nuevoConcepto })
        }
      });

      return NextResponse.json({ success: true, concepto: nuevoConcepto });
    }

    // ── action: eliminar ─────────────────────────────────────────────────────
    if (action === 'eliminar') {
      const { id } = data || {};

      if (!id) {
        return NextResponse.json({ error: 'Falta el ID del concepto.' }, { status: 400 });
      }

      // Check if used in transactions
      const count = await prisma.transaccionFinanciera.count({
        where: { concepto_id: id }
      });

      if (count > 0) {
        return NextResponse.json({ error: 'No se puede eliminar este concepto porque ya está asociado a transacciones existentes.' }, { status: 400 });
      }

      const deleted = await prisma.conceptoFinanciero.delete({
        where: { id }
      });

      // Registrar auditoría
      await prisma.auditoriaFinanciera.create({
        data: {
          iglesia_id: iglesiaId,
          usuario_id: user.id,
          usuario_nombre: user.persona?.nombre || user.email.split('@')[0],
          accion: 'ELIMINAR',
          tabla_afectada: 'ConceptoFinanciero',
          registro_id: deleted.id,
          detalles: JSON.stringify({ deleted })
        }
      });

      return NextResponse.json({ success: true, deleted });
    }

    return NextResponse.json({ error: 'Acción no soportada' }, { status: 400 });

  } catch (error: any) {
    console.error('[POST /api/finanzas/conceptos]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
