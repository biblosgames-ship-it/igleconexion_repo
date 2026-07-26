import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getActiveChurchId } from '@/lib/active-church';

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const iglesiaId = await getActiveChurchId();
    if (!iglesiaId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { id } = await params;
    const item = await prisma.recursoBiblioteca.findUnique({ where: { id } });
    if (!item || item.iglesia_id !== iglesiaId) {
      return NextResponse.json({ error: 'Recurso no encontrado' }, { status: 404 });
    }

    await prisma.recursoBiblioteca.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const iglesiaId = await getActiveChurchId();
    if (!iglesiaId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();

    const item = await prisma.recursoBiblioteca.findUnique({ where: { id } });
    if (!item || item.iglesia_id !== iglesiaId) {
      return NextResponse.json({ error: 'Recurso no encontrado' }, { status: 404 });
    }

    if (body.action === 'increment_download') {
      const updated = await prisma.recursoBiblioteca.update({
        where: { id },
        data: { descargas_count: { increment: 1 } }
      });
      return NextResponse.json(updated);
    }

    const updated = await prisma.recursoBiblioteca.update({
      where: { id },
      data: {
        titulo: body.titulo ?? item.titulo,
        descripcion: body.descripcion ?? item.descripcion,
        categoria: body.categoria ?? item.categoria,
        tipo: body.tipo ?? item.tipo,
        url_recurso: body.url_recurso ?? item.url_recurso,
        url_miniatura: body.url_miniatura ?? item.url_miniatura,
        tags: body.tags ?? item.tags
      }
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
