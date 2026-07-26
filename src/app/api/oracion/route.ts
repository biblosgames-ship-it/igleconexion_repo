import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getActiveChurchId, getSessionUserId } from '@/lib/active-church';

export async function GET() {
  try {
    const iglesiaId = await getActiveChurchId();
    const userId = await getSessionUserId();

    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = await prisma.usuario.findUnique({
      where: { id: userId },
      select: { rol: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { rol } = user;

    // Fetch all prayer requests for this church
    const peticiones = await prisma.peticionOracion.findMany({
      where: { iglesia_id: iglesiaId },
      orderBy: { createdAt: 'desc' },
    });

    // If the user is MIEMBRO or LIDER, filter out confidential records
    const isRestricted = rol === 'MIEMBRO' || rol === 'LIDER';
    if (isRestricted) {
      const filtradas = peticiones.filter((p) => !p.es_confidencial);
      return NextResponse.json(filtradas);
    }

    return NextResponse.json(peticiones);
  } catch (error) {
    console.error('[GET /api/oracion]', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, data } = body;

    const iglesiaId = await getActiveChurchId();
    const userId = await getSessionUserId();

    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = await prisma.usuario.findUnique({
      where: { id: userId },
      select: {
        rol: true,
        email: true,
        persona_id: true,
        persona: {
          select: { nombre: true }
        }
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { rol, email, persona, persona_id } = user;

    if (action === 'crear') {
      const { peticion, es_confidencial, nombre_solicitante: nombreOverride } = data ?? {};

      if (typeof peticion !== 'string' || peticion.trim() === '') {
        return NextResponse.json({ error: 'El campo "peticion" es requerido' }, { status: 400 });
      }

      if (typeof es_confidencial !== 'boolean') {
        return NextResponse.json({ error: 'El campo "es_confidencial" es requerido y debe ser booleano' }, { status: 400 });
      }

      // Determine nombre_solicitante
      let nombre_solicitante: string;
      if (nombreOverride && typeof nombreOverride === 'string' && nombreOverride.trim() !== '') {
        nombre_solicitante = nombreOverride.trim();
      } else if (persona?.nombre) {
        nombre_solicitante = persona.nombre;
      } else if (email) {
        nombre_solicitante = email.split('@')[0];
      } else {
        nombre_solicitante = 'Anónimo';
      }

      const nuevaPeticion = await prisma.peticionOracion.create({
        data: {
          iglesia_id: iglesiaId,
          persona_id: persona_id,
          peticion: peticion.trim(),
          es_confidencial,
          nombre_solicitante,
          estado: 'ACTIVA',
        },
      });

      return NextResponse.json(nuevaPeticion, { status: 201 });
    }

    if (action === 'actualizarEstado') {
      if (rol !== 'ADMIN_IGLESIA' && rol !== 'SUPERADMIN') {
        return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
      }

      const { id, estado } = data ?? {};

      if (!id) {
        return NextResponse.json({ error: 'El campo "id" es requerido' }, { status: 400 });
      }

      const estadosValidos = ['ACTIVA', 'ORANDO', 'RESPONDIDA'];
      if (!estadosValidos.includes(estado)) {
        return NextResponse.json(
          { error: `El campo "estado" debe ser uno de: ${estadosValidos.join(', ')}` },
          { status: 400 }
        );
      }

      const actualizada = await prisma.peticionOracion.update({
        where: { id },
        data: { estado },
      });

      return NextResponse.json({ success: true, peticion: actualizada });
    }

    if (action === 'eliminar') {
      if (rol !== 'ADMIN_IGLESIA' && rol !== 'SUPERADMIN') {
        return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
      }

      const { id } = data ?? {};

      if (!id) {
        return NextResponse.json({ error: 'El campo "id" es requerido' }, { status: 400 });
      }

      await prisma.peticionOracion.delete({
        where: { id },
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Acción no reconocida' }, { status: 400 });
  } catch (error) {
    console.error('[POST /api/oracion]', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
