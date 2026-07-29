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

    const dbRecursos = await prisma.recursoBiblioteca.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });

    // Fusionar recursos cargados desde la Configuración de la Iglesia (JSON iglesia.recursos)
    const iglesia = await prisma.iglesia.findUnique({
      where: { id: iglesiaId },
      select: { recursos: true }
    });

    let jsonRecursos: any[] = [];
    if (iglesia?.recursos) {
      try {
        const parsed = JSON.parse(iglesia.recursos);
        if (Array.isArray(parsed)) {
          jsonRecursos = parsed.map((item: any, idx: number) => {
            const rawUrl = item.url_recurso || item.url || item.link || "";
            let miniatura = item.url_miniatura || item.miniatura || item.imagen || null;
            let itemTipo = (item.tipo || "LINK").toUpperCase();
            if (["FOTOGRAFIA", "FOTO", "IMAGEN", "GALERÍA", "GALERIA"].includes(itemTipo)) {
              itemTipo = "GALERIA";
            }

            if (itemTipo === "VIDEO" && !miniatura && rawUrl) {
              const ytMatch = rawUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
              if (ytMatch && ytMatch[1]) {
                miniatura = `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
              }
            } else if (itemTipo === "GALERIA" && !miniatura && rawUrl) {
              miniatura = rawUrl;
            }

            return {
              id: item.id || `json-rec-${idx}`,
              iglesia_id: iglesiaId,
              titulo: item.titulo || item.nombre || "Recurso de la Iglesia",
              descripcion: item.descripcion || item.detalle || null,
              categoria: item.categoria || "General",
              tipo: itemTipo,
              url_recurso: rawUrl,
              url_miniatura: miniatura,
              creado_por: "Administración",
              createdAt: item.createdAt || new Date().toISOString(),
            };
          });
        }
      } catch (e) {
        console.error("Error al procesar JSON de recursos de la iglesia:", e);
      }
    }

    // Filtrar recursos del JSON de la iglesia si hay filtros aplicados
    const filteredJsonRecursos = jsonRecursos.filter((r) => {
      if (tipo && tipo !== 'TODOS' && r.tipo !== tipo) return false;
      if (categoria && categoria !== 'TODOS' && r.categoria !== categoria) return false;
      if (query) {
        const q = query.toLowerCase();
        const matchTitle = r.titulo?.toLowerCase().includes(q);
        const matchDesc = r.descripcion?.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc) return false;
      }
      return true;
    });

    // Fusionar sin duplicados por url_recurso o id
    const combinedMap = new Map();
    dbRecursos.forEach((r) => combinedMap.set(r.url_recurso || r.id, r));
    filteredJsonRecursos.forEach((r) => {
      const key = r.url_recurso || r.id;
      if (!combinedMap.has(key)) {
        combinedMap.set(key, r);
      }
    });

    const finalRecursos = Array.from(combinedMap.values());
    return NextResponse.json(finalRecursos);
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

    if (!titulo || !tipo || (!url_recurso && tipo !== 'BLOG')) {
      return NextResponse.json({ error: 'Título, Tipo y URL del recurso son obligatorios.' }, { status: 400 });
    }

    const finalUrl = url_recurso || (tipo === 'BLOG' ? '#blog' : '');

    // Procesamiento especial para YouTube y Galerías
    let miniaturaFinal = url_miniatura || null;
    if (tipo === 'VIDEO' && !miniaturaFinal) {
      const ytMatch = finalUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
      if (ytMatch && ytMatch[1]) {
        miniaturaFinal = `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
      }
    } else if (tipo === 'GALERIA' && !miniaturaFinal && finalUrl) {
      miniaturaFinal = finalUrl;
    }

    const nuevoRecurso = await prisma.recursoBiblioteca.create({
      data: {
        iglesia_id: iglesiaId,
        titulo,
        descripcion: descripcion || null,
        categoria: categoria || 'General',
        tipo,
        url_recurso: finalUrl,
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
