import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getActiveChurchId, getSessionUserId } from '@/lib/active-church';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const iglesiaId = await getActiveChurchId();
    if (!iglesiaId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get('tipo');
    const categoria = searchParams.get('categoria');
    const query = searchParams.get('query');

    const whereClause: any = { iglesia_id: iglesiaId };
    if (tipo && tipo !== 'TODOS') {
      whereClause.tipo = tipo;
    }
    if (categoria && categoria !== 'TODOS') {
      whereClause.categoria = categoria;
    }
    if (query) {
      whereClause.OR = [
        { titulo: { contains: query } },
        { descripcion: { contains: query } },
        { tags: { contains: query } },
      ];
    }

    const recursos = await prisma.recursoBiblioteca.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(recursos);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const iglesiaId = await getActiveChurchId();
    if (!iglesiaId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const userId = await getSessionUserId();
    let creadorNombre = 'Administración';
    if (userId) {
      const u = await prisma.usuario.findUnique({
        where: { id: userId },
        include: { persona: true }
      });
      if (u?.persona?.nombre) creadorNombre = u.persona.nombre;
    }

    const body = await request.json();
    const { titulo, descripcion, categoria, tipo, url_recurso, url_miniatura, tags } = body;

    if (!titulo || !tipo || !url_recurso) {
      return NextResponse.json({ error: 'Título, Tipo y URL del recurso son obligatorios.' }, { status: 400 });
    }

    // Procesamiento especial para YouTube thumbnails si no se proporciona miniatura
    let miniaturaFinal = url_miniatura || null;
    if (tipo === 'VIDEO' && !miniaturaFinal) {
      const ytMatch = url_recurso.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
      if (ytMatch && ytMatch[1]) {
        miniaturaFinal = `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
      }
    }

    const nuevoRecurso = await prisma.recursoBiblioteca.create({
      data: {
        iglesia_id: iglesiaId,
        titulo,
        descripcion: descripcion || null,
        categoria: categoria || 'General',
        tipo,
        url_recurso,
        url_miniatura: miniaturaFinal,
        creado_por: creadorNombre,
        tags: tags || null,
      }
    });

    return NextResponse.json(nuevoRecurso);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
