import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActiveChurchId, getSessionUserId } from "@/lib/active-church";

export async function GET() {
  try {
    const defaultIglesiaId = await getActiveChurchId();
    
    // Todas las queries en paralelo
    const [iglesia, grupos, usuariosRaw] = await Promise.all([
      prisma.iglesia.findUnique({
        where: { id: defaultIglesiaId },
        select: {
          label_cuerpo_oficial: true,
          label_sociedades: true,
          label_grupos_conexion: true,
          label_departamentos: true,
          label_ministerios: true,
          label_instituciones: true,
        }
      }),
      prisma.grupoTrabajo.findMany({
        where: { iglesia_id: defaultIglesiaId },
        include: {
          miembros: {
            include: {
              usuario: {
                include: { persona: true }
              }
            }
          },
          acuerdos: {
            orderBy: { fecha_publicacion: "desc" }
          },
          agenda: {
            orderBy: { fecha: "asc" }
          },
          foro: {
            include: {
              usuario: {
                include: { persona: true }
              }
            },
            orderBy: { fecha: "desc" }
          }
        }
      }),
      prisma.usuario.findMany({
        where: { iglesia_id: defaultIglesiaId },
        include: {
          persona: true,
          modulos_lider: {
            include: {
              modulo: true,
              sociedad: true,
              grupo_conexion: true,
              grupo_trabajo: true,
            }
          },
          grupo_trabajos: {
            include: {
              grupo_trabajo: true
            }
          }
        }
      }),
    ]);

    if (!iglesia) {
      return NextResponse.json({ error: "Iglesia no encontrada" }, { status: 404 });
    }

    // Enriquecer la respuesta estructurada de directivas
    const usuarios = usuariosRaw.map(u => ({
      id: u.id,
      email: u.email,
      rol: u.rol,
      estado: u.estado,
      persona: u.persona ? {
        id: u.persona.id,
        nombre: u.persona.nombre,
        foto_url: u.persona.foto_url
      } : null,
      directivas: [
        ...u.modulos_lider.map(ml => {
          let modulo_nombre = ml.modulo?.nombre_modulo || null;
          let sociedad_nombre = ml.sociedad?.nombre_sociedad || null;
          let grupo_conexion_nombre = ml.grupo_conexion?.nombre_grupo || null;
          let grupo_trabajo_nombre = ml.grupo_trabajo?.nombre || null;
          return {
            id: ml.id,
            alcance_tipo: ml.alcance_tipo,
            modulo_id: ml.modulo_id,
            modulo_nombre,
            sociedad_id: ml.sociedad_id,
            sociedad_nombre,
            grupo_conexion_id: ml.grupo_conexion_id,
            grupo_conexion_nombre,
            grupo_trabajo_id: ml.grupo_trabajo_id,
            grupo_trabajo_nombre
          };
        }),
        ...u.grupo_trabajos.map(gt => ({
          id: gt.id,
          alcance_tipo: gt.grupo_trabajo.tipo,
          modulo_id: null,
          modulo_nombre: gt.puesto,
          sociedad_id: null,
          sociedad_nombre: gt.grupo_trabajo.nombre,
          grupo_conexion_id: null,
          grupo_conexion_nombre: gt.grupo_trabajo.nombre
        }))
      ]
    }));

    return NextResponse.json({
      labels: iglesia,
      grupos,
      usuarios
    });
  } catch (error: any) {
    console.error("Error en GET /api/liderazgo:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const defaultIglesiaId = await getActiveChurchId();
    const userId = await getSessionUserId();
    const body = await request.json();
    const { action, data } = body;

    if (!action) {
      return NextResponse.json({ error: "Falta la acción (action)" }, { status: 400 });
    }

    switch (action) {
      case "createGrupoTrabajo": {
        const { nombre, tipo, descripcion } = data;
        const newGroup = await prisma.grupoTrabajo.create({
          data: {
            iglesia_id: defaultIglesiaId,
            nombre,
            tipo,
            descripcion
          }
        });
        return NextResponse.json(newGroup);
      }

      case "deleteGrupoTrabajo": {
        const { id } = data;
        await prisma.grupoTrabajo.delete({
          where: { id }
        });
        return NextResponse.json({ success: true });
      }

      case "addMiembroGrupo": {
        const { grupo_trabajo_id, usuario_id, persona_id, puesto } = data;
        let targetUserId = usuario_id;

        // Si se envió persona_id directamente, buscar o crear la cuenta de usuario para este miembro
        if (!targetUserId && persona_id) {
          let user = await prisma.usuario.findFirst({
            where: { persona_id }
          });

          if (!user) {
            const persona = await prisma.persona.findUnique({ where: { id: persona_id } });
            if (persona) {
              const generatedEmail = persona.correo && persona.correo.trim()
                ? persona.correo.trim()
                : `${persona.nombre.toLowerCase().replace(/[^a-z0-9]/g, "")}_${persona.id.slice(0, 4)}@igleconexion.local`;

              user = await prisma.usuario.findUnique({ where: { email: generatedEmail } });
              if (!user) {
                user = await prisma.usuario.create({
                  data: {
                    iglesia_id: defaultIglesiaId,
                    email: generatedEmail,
                    password: "password123",
                    rol: "LIDER",
                    persona_id: persona.id,
                  }
                });
              } else if (!user.persona_id) {
                user = await prisma.usuario.update({
                  where: { id: user.id },
                  data: { persona_id: persona.id, rol: "LIDER" }
                });
              }
            }
          }
          targetUserId = user?.id;
        }

        if (!targetUserId) {
          return NextResponse.json({ error: "No se seleccionó un líder o miembro válido." }, { status: 400 });
        }

        // Evitar duplicados en el mismo grupo de directiva
        const existingMiembro = await prisma.miembroGrupoTrabajo.findFirst({
          where: {
            grupo_trabajo_id,
            usuario_id: targetUserId
          }
        });

        if (existingMiembro) {
          return NextResponse.json({ error: "Esta persona ya forma parte de la directiva de este grupo." }, { status: 400 });
        }

        // Registrar miembro en la directiva
        const newMiembro = await prisma.miembroGrupoTrabajo.create({
          data: {
            grupo_trabajo_id,
            usuario_id: targetUserId,
            puesto: puesto || "LIDER"
          }
        });

        // Asegurarse de que el usuario tenga rol de LIDER
        const user = await prisma.usuario.findUnique({
          where: { id: targetUserId }
        });
        if (user && user.rol === "MIEMBRO") {
          await prisma.usuario.update({
            where: { id: targetUserId },
            data: { rol: "LIDER" }
          });
        }

        return NextResponse.json(newMiembro);
      }

      case "removeMiembroGrupo": {
        const { id } = data;
        await prisma.miembroGrupoTrabajo.delete({
          where: { id }
        });
        return NextResponse.json({ success: true });
      }

      case "addAcuerdo": {
        const { grupo_trabajo_id, titulo, contenido, creado_por } = data;
        const newAcuerdo = await prisma.acuerdoGrupoTrabajo.create({
          data: {
            grupo_trabajo_id,
            titulo,
            contenido,
            creado_por
          }
        });
        return NextResponse.json(newAcuerdo);
      }

      case "addAgendaEvent": {
        const { grupo_trabajo_id, titulo, descripcion, fecha, hora } = data;
        const newEvent = await prisma.agendaGrupoTrabajo.create({
          data: {
            grupo_trabajo_id,
            titulo,
            descripcion,
            fecha: new Date(fecha),
            hora
          }
        });
        return NextResponse.json(newEvent);
      }

      case "addComment": {
        const { grupo_trabajo_id, comentario } = data;
        if (!userId) {
          return NextResponse.json({ error: "Sesión no válida" }, { status: 401 });
        }
        const newComment = await prisma.foroGrupoTrabajo.create({
          data: {
            grupo_trabajo_id,
            usuario_id: userId,
            comentario
          },
          include: {
            usuario: {
              include: {
                persona: true
              }
            }
          }
        });
        return NextResponse.json(newComment);
      }

      case "updateLabels": {
        const {
          label_cuerpo_oficial,
          label_sociedades,
          label_grupos_conexion,
          label_departamentos,
          label_ministerios,
          label_instituciones
        } = data;

        const updatedIglesia = await prisma.iglesia.update({
          where: { id: defaultIglesiaId },
          data: {
            label_cuerpo_oficial,
            label_sociedades,
            label_grupos_conexion,
            label_departamentos,
            label_ministerios,
            label_instituciones
          }
        });
        return NextResponse.json(updatedIglesia);
      }

      default:
        return NextResponse.json({ error: `Acción '${action}' no soportada` }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Error en POST /api/liderazgo:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
