import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getActiveChurchId, getSessionUserId } from '@/lib/active-church';

export async function GET(request: Request) {
  try {
    const defaultIglesiaId = await getActiveChurchId();
    const { searchParams } = new URL(request.url);
    const grupoId = searchParams.get('id');

    if (grupoId) {
      const grupo = await prisma.grupoFamilia.findUnique({
        where: { id: grupoId },
        include: {
          personas: {
            include: {
              etapa: true
            }
          },
          lideres_modulo: {
            where: { alcance_tipo: "GRUPO_FAMILIA" },
            include: {
              usuario: {
                include: { persona: true }
              }
            }
          },
          acuerdos: { orderBy: { fecha_publicacion: 'desc' } },
          necesidades: { orderBy: { createdAt: 'desc' } }
        }
      });
      return NextResponse.json({ grupo });
    }

    const grupos = await prisma.grupoFamilia.findMany({
      where: { iglesia_id: defaultIglesiaId },
      orderBy: { numero_grupo: 'asc' },
      include: {
        personas: true,
        lideres_modulo: {
          where: { alcance_tipo: "GRUPO_FAMILIA" },
          include: { usuario: { include: { persona: true } } }
        },
        acuerdos: { orderBy: { fecha_publicacion: 'desc' } },
        necesidades: { orderBy: { createdAt: 'desc' } }
      }
    });

    return NextResponse.json({ grupos });
  } catch (error: any) {
    console.error("Error in GET /api/grupos-familia:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const defaultIglesiaId = await getActiveChurchId();
    const userId = await getSessionUserId();
    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case "createGrupoFamilia": {
        const { numero_grupo, nombre_grupo, direccion_reunion, dia_hora_reunion, descripcion, logo_url } = data;

        if (!nombre_grupo || !nombre_grupo.trim()) {
          return NextResponse.json({ error: "El nombre del Grupo de Familia es obligatorio" }, { status: 400 });
        }

        const newGrupo = await prisma.grupoFamilia.create({
          data: {
            iglesia_id: defaultIglesiaId,
            numero_grupo: numero_grupo ? parseInt(numero_grupo) : 1,
            nombre_grupo: nombre_grupo.trim(),
            direccion_reunion: direccion_reunion || null,
            dia_hora_reunion: dia_hora_reunion || null,
            descripcion: descripcion || null,
            logo_url: logo_url || null,
          }
        });

        return NextResponse.json({ success: true, grupo: newGrupo });
      }

      case "updateGrupoFamilia": {
        const { id, numero_grupo, nombre_grupo, direccion_reunion, dia_hora_reunion, descripcion, logo_url } = data;

        const updated = await prisma.grupoFamilia.update({
          where: { id },
          data: {
            numero_grupo: numero_grupo ? parseInt(numero_grupo) : undefined,
            nombre_grupo: nombre_grupo ? nombre_grupo.trim() : undefined,
            direccion_reunion: direccion_reunion !== undefined ? direccion_reunion : undefined,
            dia_hora_reunion: dia_hora_reunion !== undefined ? dia_hora_reunion : undefined,
            descripcion: descripcion !== undefined ? descripcion : undefined,
            logo_url: logo_url !== undefined ? logo_url : undefined,
          }
        });

        return NextResponse.json({ success: true, grupo: updated });
      }

      case "deleteGrupoFamilia": {
        const { id } = data;

        // Desvincular personas
        await prisma.persona.updateMany({
          where: { grupo_familia_id: id },
          data: { grupo_familia_id: null }
        });

        // Eliminar lideres asignados
        await prisma.liderModulo.deleteMany({
          where: { grupo_familia_id: id }
        });

        await prisma.grupoFamilia.delete({
          where: { id }
        });

        return NextResponse.json({ success: true });
      }

      case "assignPersonaToGrupoFamilia": {
        const { persona_id, grupo_familia_id, assignFamilyCode } = data;

        const targetPersona = await prisma.persona.findUnique({
          where: { id: persona_id }
        });

        if (!targetPersona) {
          return NextResponse.json({ error: "Persona no encontrada" }, { status: 400 });
        }

        // Si se marca assignFamilyCode, asignar a toda la familia
        if (assignFamilyCode && targetPersona.familia_codigo) {
          await prisma.persona.updateMany({
            where: {
              iglesia_id: defaultIglesiaId,
              familia_codigo: targetPersona.familia_codigo
            },
            data: { grupo_familia_id: grupo_familia_id || null }
          });
        } else {
          await prisma.persona.update({
            where: { id: persona_id },
            data: { grupo_familia_id: grupo_familia_id || null }
          });
        }

        return NextResponse.json({ success: true });
      }

      case "addLiderGrupoFamilia": {
        const { grupo_familia_id, persona_id, usuario_id } = data;

        let targetUserId = usuario_id;
        if (!targetUserId && persona_id) {
          const u = await prisma.usuario.findFirst({
            where: { persona_id }
          });
          if (u) targetUserId = u.id;
        }

        if (!targetUserId) {
          return NextResponse.json({ error: "El usuario seleccionado no posee una cuenta activa para liderar." }, { status: 400 });
        }

        const newLider = await prisma.liderModulo.create({
          data: {
            usuario_id: targetUserId,
            alcance_tipo: "GRUPO_FAMILIA",
            grupo_familia_id
          }
        });

        return NextResponse.json({ success: true, lider: newLider });
      }

      case "removeLiderGrupoFamilia": {
        const { lider_id } = data;
        await prisma.liderModulo.delete({
          where: { id: lider_id }
        });
        return NextResponse.json({ success: true });
      }

      case "createAcuerdoGrupoFamilia": {
        const { grupo_familia_id, titulo, contenido, creado_por } = data;

        if (!titulo || !contenido) {
          return NextResponse.json({ error: "El título y contenido del acuerdo son obligatorios" }, { status: 400 });
        }

        const acuerdo = await prisma.acuerdoGrupoFamilia.create({
          data: {
            grupo_familia_id,
            titulo: titulo.trim(),
            contenido: contenido.trim(),
            creado_por: creado_por || "Líder de Grupo de Familia"
          }
        });

        return NextResponse.json({ success: true, acuerdo });
      }

      case "reportNecesidadFamilia": {
        const { grupo_familia_id, solicitante_nombre, descripcion, familia_codigo } = data;

        if (!descripcion || !descripcion.trim()) {
          return NextResponse.json({ error: "Por favor describe la necesidad o petición de oración." }, { status: 400 });
        }

        const necesidad = await prisma.necesidadFamilia.create({
          data: {
            grupo_familia_id,
            solicitante_nombre: solicitante_nombre || "Miembro de la Iglesia",
            descripcion: descripcion.trim(),
            familia_codigo: familia_codigo || null,
            estado: "PENDIENTE"
          }
        });

        return NextResponse.json({ success: true, necesidad });
      }

      case "updateNecesidadEstado": {
        const { necesidad_id, estado, notas_lider } = data;

        const updated = await prisma.necesidadFamilia.update({
          where: { id: necesidad_id },
          data: {
            estado,
            notas_lider: notas_lider !== undefined ? notas_lider : undefined
          }
        });

        return NextResponse.json({ success: true, necesidad: updated });
      }

      default:
        return NextResponse.json({ error: "Acción no reconocida" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Error in POST /api/grupos-familia:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
