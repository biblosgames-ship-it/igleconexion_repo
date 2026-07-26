import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActiveChurchId, getSessionUserId } from "@/lib/active-church";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const defaultIglesiaId = await getActiveChurchId();
    const userId = await getSessionUserId();

    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // 1. Fetch current user and linked persona
    const userObj = await prisma.usuario.findUnique({
      where: { id: userId },
      include: {
        persona: {
          include: {
            grupo_conexion: {
              include: {
                sociedad: true,
              },
            },
          },
        },
      },
    });

    if (!userObj) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    const persona = userObj.persona;

    // --- AUTOMATIC GROUP MATCHING / AGE TRANSITION LOGIC ---
    let assignedGroupId = persona?.grupo_conexion_id;

    if (persona && persona.fecha_nacimiento) {
      const today = new Date();
      const birth = new Date(persona.fecha_nacimiento);
      let userAge = today.getFullYear() - birth.getFullYear();
      const mDiff = today.getMonth() - birth.getMonth();
      if (mDiff < 0 || (mDiff === 0 && today.getDate() < birth.getDate())) {
        userAge--;
      }

      // Fetch all groups in church to match or transition by age
      const churchGroups = await prisma.grupoConexion.findMany({
        where: { sociedad: { iglesia_id: defaultIglesiaId } },
        include: { sociedad: true }
      });

      const matchesGroup = (g: any) => {
        const minAge = g.rango_edad_min ?? 0;
        const maxAge = g.rango_edad_max ?? 99;
        const ageMatch = userAge >= minAge && userAge <= maxAge;

        const gSex = (g.sexo || "").toUpperCase();
        const pSex = (persona.sexo || "").toUpperCase();
        const sexMatch = !gSex || gSex === "MIXTO" || gSex === "MIX" || gSex === pSex;

        const isSoltero = ["SOLTERO/A", "SOLTERO", "DIVORCIADO/A", "VIUDO/A"].includes((persona.estado_civil || "").toUpperCase());
        const isCasado = ["CASADO/A", "CASADO", "UNIÓN LIBRE"].includes((persona.estado_civil || "").toUpperCase());

        if (g.estado_civil_requerido === "SOLTERO" && !isSoltero) return false;
        if (g.estado_civil_requerido === "CASADO" && !isCasado) return false;

        return ageMatch && sexMatch;
      };

      let currentGroupStillMatches = false;
      if (assignedGroupId) {
        const currentG = churchGroups.find((g) => g.id === assignedGroupId);
        if (currentG && matchesGroup(currentG)) {
          currentGroupStillMatches = true;
        }
      }

      // If no group assigned or current group no longer matches due to age transition
      if (!assignedGroupId || !currentGroupStillMatches) {
        const autoMatch = churchGroups.find(matchesGroup);
        if (autoMatch) {
          assignedGroupId = autoMatch.id;
          await prisma.persona.update({
            where: { id: persona.id },
            data: { grupo_conexion_id: autoMatch.id },
          });
        }
      }
    }

    // --- FETCH USER'S OWN GROUP (AS A MEMBER) ---
    let miGrupo = null;
    if (persona && assignedGroupId) {
      const dbMiGrupo = await prisma.grupoConexion.findUnique({
        where: { id: assignedGroupId },
        include: {
          sociedad: true,
          asistencias: {
            orderBy: { fecha: "desc" },
          },
          acuerdos: {
            include: {
              confirmaciones: true,
            },
            orderBy: { fecha_publicacion: "desc" },
          },
          agenda: {
            orderBy: { fecha: "asc" },
          },
          clases_biblicas: {
            orderBy: { fecha: "asc" },
          },
          comentarios_foro: {
            include: {
              persona: {
                select: { nombre: true, foto_url: true },
              },
            },
            orderBy: { fecha: "desc" },
          },
          personas: {
            include: {
              etapa: true,
            },
          },
        },
      });

      if (dbMiGrupo) {
        // Fetch leaders of this group
        const dbLideres = await prisma.liderModulo.findMany({
          where: {
            OR: [
              { grupo_conexion_id: dbMiGrupo.id },
              { alcance_tipo: "GLOBAL", modulo: { iglesia_id: defaultIglesiaId } },
              { alcance_tipo: "SOCIEDAD", sociedad_id: dbMiGrupo.sociedad_id },
            ],
          },
          include: {
            usuario: {
              include: {
                persona: true,
              },
            },
          },
        });

        const lideresMap = dbLideres.map((l) => ({
          id: l.id,
          nombre: l.usuario.persona?.nombre || l.usuario.email.split("@")[0],
          telefono: l.usuario.persona?.telefono || "Sin teléfono",
          correo: l.usuario.email,
        }));

        miGrupo = {
          ...dbMiGrupo,
          asistencias: dbMiGrupo.asistencias.map((a) => ({
            ...a,
            presentes_ids: JSON.parse(a.presentes_ids || "[]"),
          })),
          lideres: lideresMap,
        };
      }
    }

    // --- FETCH GROUPS DIRECTED (AS LEADER / ADMIN) ---
    const liderRegistros = await prisma.liderModulo.findMany({
      where: { usuario_id: userId },
    });

    let queryConditions: any[] = [];
    if (userObj.rol === "ADMIN_IGLESIA" || userObj.rol === "SUPERADMIN") {
      // Admins/Superadmins lead all groups of the church
      queryConditions.push({ sociedad: { iglesia_id: defaultIglesiaId } });
    } else if (liderRegistros.length > 0) {
      for (const lr of liderRegistros) {
        if (lr.alcance_tipo === "GLOBAL") {
          queryConditions.push({ sociedad: { iglesia_id: defaultIglesiaId } });
        } else if (lr.alcance_tipo === "SOCIEDAD" && lr.sociedad_id) {
          queryConditions.push({ sociedad_id: lr.sociedad_id });
        } else if (lr.alcance_tipo === "GRUPO_CONEXION" && lr.grupo_conexion_id) {
          queryConditions.push({ id: lr.grupo_conexion_id });
        }
      }
    }

    let gruposDirigidos: any[] = [];
    if (queryConditions.length > 0) {
      const dbGruposDirigidos = await prisma.grupoConexion.findMany({
        where: { OR: queryConditions },
        include: {
          sociedad: true,
          asistencias: {
            orderBy: { fecha: "desc" },
          },
          acuerdos: {
            include: {
              confirmaciones: true,
            },
            orderBy: { fecha_publicacion: "desc" },
          },
          agenda: {
            orderBy: { fecha: "asc" },
          },
          clases_biblicas: {
            orderBy: { fecha: "asc" },
          },
          comentarios_foro: {
            include: {
              persona: {
                select: { nombre: true, foto_url: true },
              },
            },
            orderBy: { fecha: "desc" },
          },
          personas: {
            include: {
              etapa: true,
              historial_tareas: {
                where: { completada: true },
              },
              etiquetas: {
                where: {
                  activa: true,
                  OR: [
                    { fecha_fin: null },
                    { fecha_fin: { gt: new Date() } },
                  ],
                },
                include: { etiqueta: true },
              },
            },
          },
        },
      });

      gruposDirigidos = dbGruposDirigidos.map((g) => ({
        ...g,
        asistencias: g.asistencias.map((a) => ({
          ...a,
          presentes_ids: JSON.parse(a.presentes_ids || "[]"),
        })),
      }));
    }

    // --- FETCH ALL CHURCH GROUPS (FOR DISCOVERY DIRECTORY) ---
    const dbTodosLosGrupos = await prisma.grupoConexion.findMany({
      where: {
        sociedad: { iglesia_id: defaultIglesiaId }
      },
      include: {
        sociedad: true,
        _count: {
          select: { personas: true }
        }
      },
      orderBy: { nombre_grupo: 'asc' }
    });

    const todosLosGrupos = dbTodosLosGrupos.map((g) => ({
      id: g.id,
      nombre_grupo: g.nombre_grupo,
      sociedad_nombre: g.sociedad?.nombre_sociedad || "Sociedad",
      sociedad_id: g.sociedad_id,
      rango_edad_min: g.rango_edad_min,
      rango_edad_max: g.rango_edad_max,
      sexo: g.sexo,
      lugar_reunion: g.lugar_reunion || "Por definir en Templo",
      dia_reunion: g.dia_reunion || "Por definir",
      mensaje_bienvenida: g.mensaje_bienvenida || "¡Bienvenidos a nuestro grupo de conexión!",
      total_integrantes: g._count.personas
    }));

    return NextResponse.json({
      miGrupo,
      gruposDirigidos,
      todosLosGrupos,
      personaId: persona?.id || null,
      personaNombre: persona?.nombre || null,
      userRole: userObj.rol,
    });
  } catch (error: any) {
    console.error("Error in GET /api/grupo:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, data } = body;

    if (!action) {
      return NextResponse.json({ error: "Missing action" }, { status: 400 });
    }

    switch (action) {
      case "joinGroup": {
        const userId = await getSessionUserId();
        if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        const userObj = await prisma.usuario.findUnique({ where: { id: userId }, include: { persona: true } });
        if (!userObj?.persona) return NextResponse.json({ error: "No tienes un perfil de persona asociado" }, { status: 400 });
        
        const { grupo_conexion_id } = data;
        const updatedPersona = await prisma.persona.update({
          where: { id: userObj.persona.id },
          data: { grupo_conexion_id },
        });
        return NextResponse.json({ success: true, persona: updatedPersona });
      }

      case "updateGroupInfo": {
        const { grupo_conexion_id, lugar_reunion, dia_reunion, mensaje_bienvenida } = data;
        const updatedGroup = await prisma.grupoConexion.update({
          where: { id: grupo_conexion_id },
          data: {
            ...(lugar_reunion !== undefined && { lugar_reunion }),
            ...(dia_reunion !== undefined && { dia_reunion }),
            ...(mensaje_bienvenida !== undefined && { mensaje_bienvenida }),
          },
        });
        return NextResponse.json(updatedGroup);
      }

      case "addAttendance": {
        const { grupo_conexion_id, fecha, presentes_ids } = data;
        const newAttendance = await prisma.asistenciaReunion.create({
          data: {
            grupo_conexion_id,
            fecha: new Date(fecha),
            presentes_ids: JSON.stringify(presentes_ids || []),
          },
        });

        try {
          // Obtener todos los miembros del grupo
          const miembros = await prisma.persona.findMany({
            where: { grupo_conexion_id },
            include: { usuario: true },
          });

          // Obtener nombre del grupo de conexión
          const grupo = await prisma.grupoConexion.findUnique({
            where: { id: grupo_conexion_id },
          });
          const nombreGrupo = grupo?.nombre_grupo || "Grupo de Conexión";

          // Filtrar los que están ausentes (su ID no está en presentes_ids)
          const ausentes = miembros.filter((m) => !presentes_ids.includes(m.id));

          // Crear notificación in-app para cada ausente que tenga un usuario asociado
          for (const miembro of ausentes) {
            if (miembro.usuario) {
              await prisma.notificacion.create({
                data: {
                  usuario_id: miembro.usuario.id,
                  titulo: "Te extrañamos en el grupo",
                  mensaje: `Hola ${miembro.nombre}, notamos que no pudiste asistir a la última reunión de tu grupo "${nombreGrupo}". ¡Esperamos verte pronto!`,
                  tipo: "ASISTENCIA",
                },
              });
            }
          }
        } catch (notifError) {
          console.error("Error al generar notificaciones de inasistencia:", notifError);
        }

        return NextResponse.json(newAttendance);
      }

      case "addAgreement": {
        const { grupo_conexion_id, titulo, contenido, creado_por } = data;
        const newAgreement = await prisma.acuerdoGrupo.create({
          data: {
            grupo_conexion_id,
            titulo,
            contenido,
            creado_por,
          },
        });
        return NextResponse.json(newAgreement);
      }

      case "confirmAgreement": {
        const { acuerdo_id, persona_id } = data;
        const confirmation = await prisma.acuerdoConfirmacion.upsert({
          where: {
            acuerdo_id_persona_id: { acuerdo_id, persona_id },
          },
          update: {
            confirmado: true,
          },
          create: {
            acuerdo_id,
            persona_id,
            confirmado: true,
          },
        });
        return NextResponse.json(confirmation);
      }

      case "addAgendaEvent": {
        const { grupo_conexion_id, titulo, descripcion, fecha, hora } = data;
        const newEvent = await prisma.agendaGrupo.create({
          data: {
            grupo_conexion_id,
            titulo,
            descripcion,
            fecha: new Date(fecha),
            hora,
          },
        });
        return NextResponse.json(newEvent);
      }

      case "addComment": {
        const { grupo_conexion_id, persona_id, comentario } = data;
        const newComment = await prisma.foroComentario.create({
          data: {
            grupo_conexion_id,
            persona_id,
            comentario,
          },
          include: {
            persona: {
              select: { nombre: true, foto_url: true },
            },
          },
        });
        return NextResponse.json(newComment);
      }

      case "addClaseBiblica": {
        const { grupo_conexion_id, fecha, serie, tema, texto_clave, verdad_central, objetivo, puntos, creado_por } = data;
        const newClass = await prisma.claseBiblica.create({
          data: {
            grupo_conexion_id,
            fecha: new Date(fecha),
            serie,
            tema,
            texto_clave,
            verdad_central,
            objetivo,
            puntos_json: JSON.stringify(puntos || []),
            creado_por,
          },
        });
        return NextResponse.json(newClass);
      }

      case "deleteClaseBiblica": {
        const { id } = data;
        await prisma.claseBiblica.delete({ where: { id } });
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: `Action '${action}' not supported` }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Error in POST /api/grupo:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
