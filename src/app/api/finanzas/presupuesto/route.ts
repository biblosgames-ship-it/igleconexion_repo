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

    const budgets = await prisma.presupuesto.findMany({
      where: { iglesia_id: iglesiaId },
      orderBy: { anio: 'desc' }
    });

    const projectIds = Array.from(new Set(budgets.map(b => b.proyecto_id).filter(Boolean))) as string[];
    const proyectos = await prisma.proyectoFinanciero.findMany({
      where: { id: { in: projectIds } }
    });
    const proyectosMap = new Map(proyectos.map(p => [p.id, p]));

    const enriched = budgets.map(b => {
      const p = b.proyecto_id ? proyectosMap.get(b.proyecto_id) : null;
      return {
        ...b,
        proyectoNombre: p?.nombre ?? null
      };
    });

    return NextResponse.json(enriched);

  } catch (error: any) {
    console.error('[GET /api/finanzas/presupuesto]', error);
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

    if (action === 'crear') {
      const { anio, departamento, ministerio, proyecto_id, monto_asignado } = data ?? {};

      if (!anio || monto_asignado == null) {
        return NextResponse.json({ error: 'Campos requeridos: anio, monto_asignado' }, { status: 400 });
      }

      const budget = await prisma.$transaction(async (tx) => {
        const nuevo = await tx.presupuesto.create({
          data: {
            iglesia_id: iglesiaId,
            anio: Number(anio),
            departamento: departamento || null,
            ministerio: ministerio || null,
            proyecto_id: proyecto_id || null,
            monto_asignado: Number(monto_asignado),
            monto_ejecutado: 0.0
          }
        });

        await tx.auditoriaFinanciera.create({
          data: {
            iglesia_id: iglesiaId,
            usuario_id: user.id,
            usuario_nombre: userDisplayName,
            accion: 'CREAR',
            tabla_afectada: 'Presupuesto',
            registro_id: nuevo.id,
            detalles: JSON.stringify({ nuevoPresupuesto: nuevo })
          }
        });

        return nuevo;
      });

      return NextResponse.json({ success: true, budget });
    }

    return NextResponse.json({ error: 'Acción desconocida' }, { status: 400 });

  } catch (error: any) {
    console.error('[POST /api/finanzas/presupuesto]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
