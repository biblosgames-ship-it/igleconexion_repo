import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getActiveChurchId, getSessionUserId } from '@/lib/active-church';

// ─── GET ─────────────────────────────────────────────────────────────────────
export async function GET() {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const user = await prisma.usuario.findUnique({
      where: { id: userId },
      select: { rol: true },
    });

    if (!user || (user.rol !== 'ADMIN_IGLESIA' && user.rol !== 'SUPERADMIN')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const iglesiaId = await getActiveChurchId();

    const registros = await prisma.bitacoraPastoral.findMany({
      where: { iglesia_id: iglesiaId },
      orderBy: { fecha: 'desc' },
    });

    // Manually enrich persona and lider because they are not defined as relations in schema.prisma
    const personaIds = Array.from(new Set(registros.map((r) => r.persona_id)));
    const liderIds = Array.from(new Set(registros.map((r) => r.lider_id)));

    const personas = await prisma.persona.findMany({
      where: { id: { in: personaIds } },
      select: { id: true, nombre: true },
    });

    const lideres = await prisma.usuario.findMany({
      where: { id: { in: liderIds } },
      select: {
        id: true,
        email: true,
        persona: {
          select: { nombre: true },
        },
      },
    });

    const personasMap = new Map(personas.map((p) => [p.id, p]));
    const lideresMap = new Map(lideres.map((l) => [l.id, l]));

    const enriched = registros.map((r) => {
      const p = personasMap.get(r.persona_id);
      const l = lideresMap.get(r.lider_id);
      const name = p?.nombre ?? null;
      const leaderName = l?.persona?.nombre ?? l?.email ?? null;
      return {
        ...r,
        personaNombre: name,
        persona_nombre: name,
        liderNombre: leaderName,
        lider_nombre: leaderName,
      };
    });

    return NextResponse.json(enriched);
  } catch (error) {
    console.error('[GET /api/bitacora]', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// ─── POST ────────────────────────────────────────────────────────────────────
export async function POST(request: Request) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const user = await prisma.usuario.findUnique({
      where: { id: userId },
      select: { rol: true },
    });

    if (!user || (user.rol !== 'ADMIN_IGLESIA' && user.rol !== 'SUPERADMIN')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const { action, data } = body;

    // ── crear ──────────────────────────────────────────────────────────────
    if (action === 'crear') {
      const { persona_id, tipo, notas, fecha } = data ?? {};

      if (!persona_id || !tipo || !notas || !fecha) {
        return NextResponse.json(
          { error: 'Faltan campos requeridos: persona_id, tipo, notas, fecha' },
          { status: 400 },
        );
      }

      const tiposValidos = ['VISITA', 'LLAMADA', 'MENSAJE'] as const;
      if (!tiposValidos.includes(tipo)) {
        return NextResponse.json(
          { error: `tipo inválido. Debe ser uno de: ${tiposValidos.join(', ')}` },
          { status: 400 },
        );
      }

      const iglesiaId = await getActiveChurchId();

      const nuevo = await prisma.bitacoraPastoral.create({
        data: {
          persona_id,
          tipo,
          notas,
          fecha: new Date(fecha),
          lider_id: userId,
          iglesia_id: iglesiaId,
        },
      });

      return NextResponse.json(nuevo, { status: 201 });
    }

    // ── eliminar ───────────────────────────────────────────────────────────
    if (action === 'eliminar') {
      const { id } = data ?? {};

      if (!id) {
        return NextResponse.json({ error: 'Falta el campo requerido: id' }, { status: 400 });
      }

      await prisma.bitacoraPastoral.delete({
        where: { id },
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: `Acción desconocida: ${action}` }, { status: 400 });
  } catch (error) {
    console.error('[POST /api/bitacora]', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
