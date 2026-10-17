import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getActiveChurchId, getSessionUserId } from '@/lib/active-church';
import { SECCIONES_EVALUACION, SeccionEvaluacion } from '@/lib/biblostest-romanos12';

export async function GET() {
  try {
    const iglesiaId = await getActiveChurchId();
    if (!iglesiaId) {
      return NextResponse.json({ error: 'No se encontró iglesia activa' }, { status: 400 });
    }

    const iglesia = await prisma.iglesia.findUnique({
      where: { id: iglesiaId },
      select: { opciones_registro: true }
    });

    let secciones: SeccionEvaluacion[] = SECCIONES_EVALUACION;
    let esPersonalizado = false;

    if (iglesia?.opciones_registro) {
      try {
        const parsed = JSON.parse(iglesia.opciones_registro);
        if (parsed.biblostest_preguntas && Array.isArray(parsed.biblostest_preguntas) && parsed.biblostest_preguntas.length > 0) {
          secciones = parsed.biblostest_preguntas;
          esPersonalizado = true;
        }
      } catch (e) {}
    }

    return NextResponse.json({
      secciones,
      esPersonalizado,
      seccionesDefault: SECCIONES_EVALUACION
    });
  } catch (error: any) {
    console.error('Error en GET /api/evaluaciones/romanos-12/preguntas:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const iglesiaId = await getActiveChurchId();
    if (!iglesiaId) {
      return NextResponse.json({ error: 'No se encontró iglesia activa' }, { status: 400 });
    }

    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = await prisma.usuario.findUnique({
      where: { id: userId },
      select: { rol: true }
    });

    if (user?.rol !== 'SUPERADMIN' && user?.rol !== 'ADMIN_IGLESIA' && user?.rol !== 'LIDER') {
      return NextResponse.json({ error: 'Permisos insuficientes para editar preguntas' }, { status: 403 });
    }

    const body = await request.json();
    const { action, secciones } = body;

    const iglesia = await prisma.iglesia.findUnique({
      where: { id: iglesiaId },
      select: { opciones_registro: true }
    });

    let opcionesObj: any = {};
    if (iglesia?.opciones_registro) {
      try {
        opcionesObj = JSON.parse(iglesia.opciones_registro);
      } catch (e) {}
    }

    if (action === 'restablecer') {
      delete opcionesObj.biblostest_preguntas;
      await prisma.iglesia.update({
        where: { id: iglesiaId },
        data: {
          opciones_registro: JSON.stringify(opcionesObj)
        }
      });

      return NextResponse.json({
        success: true,
        mensaje: 'Preguntas restablecidas a los textos bíblicos originales',
        secciones: SECCIONES_EVALUACION,
        esPersonalizado: false
      });
    }

    if (!secciones || !Array.isArray(secciones)) {
      return NextResponse.json({ error: 'Secciones de preguntas inválidas' }, { status: 400 });
    }

    opcionesObj.biblostest_preguntas = secciones;

    await prisma.iglesia.update({
      where: { id: iglesiaId },
      data: {
        opciones_registro: JSON.stringify(opcionesObj)
      }
    });

    return NextResponse.json({
      success: true,
      mensaje: 'Preguntas actualizadas exitosamente',
      secciones,
      esPersonalizado: true
    });
  } catch (error: any) {
    console.error('Error en POST /api/evaluaciones/romanos-12/preguntas:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
