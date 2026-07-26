import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getActiveChurchId } from '@/lib/active-church';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');

    const iglesiaId = await getActiveChurchId();

    if (!q || q.length < 3) {
      return NextResponse.json([]);
    }

    const personasAll = await prisma.persona.findMany({
      where: {
        iglesia_id: iglesiaId
      },
      select: {
        id: true,
        nombre: true,
        familia_codigo: true
      }
    });

    const normalizedQ = q.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    const personas = personasAll.filter(p => {
      const normalizedNombre = p.nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      return normalizedNombre.includes(normalizedQ);
    }).slice(0, 10);

    return NextResponse.json(personas);
  } catch (error) {
    console.error('Error searching personas:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
