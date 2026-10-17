import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getActiveChurchId, getSessionUserId } from '@/lib/active-church';
import { calcularResultadoBiblosTest, DONES_ROMANOS_12 } from '@/lib/biblostest-romanos12';

export async function GET(request: Request) {
  try {
    const iglesiaId = await getActiveChurchId();
    if (!iglesiaId) {
      return NextResponse.json({ error: 'No se encontró la iglesia activa' }, { status: 400 });
    }

    const userId = await getSessionUserId();
    let userPersonaId: string | null = null;
    let usuarioRol: string | null = null;

    if (userId) {
      const u = await prisma.usuario.findUnique({
        where: { id: userId },
        select: { id: true, rol: true, persona_id: true }
      });
      userPersonaId = u?.persona_id || null;
      usuarioRol = u?.rol || null;
    }

    // Buscar si existe el formulario BiblosTest en la iglesia
    const formBiblos = await prisma.formulario.findFirst({
      where: {
        iglesia_id: iglesiaId,
        titulo: { contains: 'BiblosTest: Romanos 12' }
      }
    });

    const respuestas = formBiblos
      ? await prisma.respuestaFormulario.findMany({
          where: { formulario_id: formBiblos.id },
          include: {
            detalles: true,
            persona: { select: { id: true, nombre: true, foto_url: true } }
          },
          orderBy: { createdAt: 'desc' }
        })
      : [];

    let miResultado = null;
    if (userPersonaId && respuestas.length > 0) {
      const miResp = respuestas.find((r) => r.persona_id === userPersonaId);
      if (miResp) {
        // Encontrar el detalle que guarda el resultado JSON
        const detResultado = miResp.detalles.find((d) => d.pregunta_id === 'resultado_calculado');
        if (detResultado) {
          try {
            miResultado = JSON.parse(detResultado.valor);
          } catch (e) {}
        }
      }
    }

    // Si es administrador o líder, proveer resumen congregacional
    let congregacionStats = null;
    if ((usuarioRol === 'SUPERADMIN' || usuarioRol === 'ADMIN_IGLESIA' || usuarioRol === 'LIDER') && respuestas.length > 0) {
      const totalEvaluaciones = respuestas.length;
      const donesConteo: Record<string, number> = {};
      let sumaPromedios = 0;
      let conPromedio = 0;

      respuestas.forEach((r) => {
        const det = r.detalles.find((d) => d.pregunta_id === 'resultado_calculado');
        if (det) {
          try {
            const parsed = JSON.parse(det.valor);
            if (parsed.donPrincipal?.nombre) {
              const dNom = parsed.donPrincipal.nombre;
              donesConteo[dNom] = (donesConteo[dNom] || 0) + 1;
            }
            if (typeof parsed.promedioGeneral === 'number') {
              sumaPromedios += parsed.promedioGeneral;
              conPromedio++;
            }
          } catch (e) {}
        }
      });

      congregacionStats = {
        totalEvaluaciones,
        promedioCongregacion: conPromedio > 0 ? Number((sumaPromedios / conPromedio).toFixed(1)) : 0,
        donesDistribucion: donesConteo
      };
    }

    return NextResponse.json({
      formularioExiste: Boolean(formBiblos),
      miResultado,
      congregacionStats
    });
  } catch (error: any) {
    console.error('Error en GET /api/evaluaciones/romanos-12:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const iglesiaId = await getActiveChurchId();
    if (!iglesiaId) {
      return NextResponse.json({ error: 'No se encontró iglesia activa' }, { status: 400 });
    }

    const body = await request.json();
    const {
      respuestasEscala = {},
      rankingDones = {},
      donSeleccionadoId = null,
      diligenciasJesus = [],
      nombreInvitado = '',
      emailInvitado = ''
    } = body;

    const iglesia = await prisma.iglesia.findUnique({
      where: { id: iglesiaId },
      select: { opciones_registro: true }
    });
    let seccionesCustom = undefined;
    if (iglesia?.opciones_registro) {
      try {
        const parsed = JSON.parse(iglesia.opciones_registro);
        if (parsed.biblostest_preguntas && Array.isArray(parsed.biblostest_preguntas) && parsed.biblostest_preguntas.length > 0) {
          seccionesCustom = parsed.biblostest_preguntas;
        }
      } catch (e) {}
    }

    // 1. Calcular resultado completo con el motor teológico de Romanos 12
    const resultado = calcularResultadoBiblosTest(
      respuestasEscala,
      rankingDones,
      donSeleccionadoId,
      diligenciasJesus,
      seccionesCustom
    );

    // 2. Comprobar si el usuario está logueado
    const userId = await getSessionUserId();
    let personaId: string | null = null;

    if (userId) {
      const u = await prisma.usuario.findUnique({
        where: { id: userId },
        select: { id: true, persona_id: true }
      });
      personaId = u?.persona_id || null;
    }

    // 3. Si hay personaId, aseguramos que exista el registro en la base de datos de Formularios
    if (personaId) {
      try {
        let formBiblos = await prisma.formulario.findFirst({
          where: {
            iglesia_id: iglesiaId,
            titulo: { contains: 'BiblosTest: Romanos 12' }
          }
        });

        if (!formBiblos) {
          formBiblos = await prisma.formulario.create({
            data: {
              iglesia_id: iglesiaId,
              titulo: 'BiblosTest: Romanos 12 - Evaluación Espiritual',
              descripcion:
                'Evaluación de consagración, renovación del entendimiento y descubrimiento de dones según Romanos 12.',
              estado: 'PUBLICADO',
              es_popup_obligatorio: false
            }
          });
        }

        // Borrar respuesta previa si ya existía para permitir reevaluación actualizada
        const existingResp = await prisma.respuestaFormulario.findUnique({
          where: {
            formulario_id_persona_id: {
              formulario_id: formBiblos.id,
              persona_id: personaId
            }
          }
        });

        if (existingResp) {
          await prisma.detalleRespuesta.deleteMany({
            where: { respuesta_id: existingResp.id }
          });
          await prisma.respuestaFormulario.delete({
            where: { id: existingResp.id }
          });
        }

        // Crear la nueva respuesta con los detalles calculados
        const nuevaRespuesta = await prisma.respuestaFormulario.create({
          data: {
            formulario_id: formBiblos.id,
            persona_id: personaId,
            detalles: {
              create: [
                {
                  pregunta_id: 'resultado_calculado',
                  valor: JSON.stringify(resultado)
                },
                {
                  pregunta_id: 'don_principal',
                  valor: resultado.donPrincipal.nombre
                },
                {
                  pregunta_id: 'promedio_general',
                  valor: String(resultado.promedioGeneral)
                },
                {
                  pregunta_id: 'diligencias_anotadas',
                  valor: JSON.stringify(resultado.diligenciasJesus)
                }
              ]
            }
          }
        });
      } catch (dbError) {
        console.error('Error al persistir resultado en base de datos:', dbError);
        // Continuamos para devolver el resultado al usuario aunque falle el guardado en BD
      }
    }

    return NextResponse.json({
      success: true,
      resultado
    });
  } catch (error: any) {
    console.error('Error en POST /api/evaluaciones/romanos-12:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
