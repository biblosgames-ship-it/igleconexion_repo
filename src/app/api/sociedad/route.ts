import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActiveChurchId, getSessionUserId } from "@/lib/active-church";

export async function GET() {
  try {
    const defaultIglesiaId = await getActiveChurchId();
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // 1. Fetch current user
    const userObj = await prisma.usuario.findUnique({
      where: { id: userId },
    });

    if (!userObj) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    // 2. Fetch leadership registers
    const liderRegistros = await prisma.liderModulo.findMany({
      where: { usuario_id: userId },
    });

    // Determine society scopes
    let societyConditions: any[] = [];

    if (userObj.rol === "ADMIN_IGLESIA" || userObj.rol === "SUPERADMIN") {
      // Admins/Superadmins have access to all societies in this church
      societyConditions.push({ iglesia_id: defaultIglesiaId });
    } else {
      for (const lr of liderRegistros) {
        if (lr.alcance_tipo === "GLOBAL") {
          societyConditions.push({ iglesia_id: defaultIglesiaId });
        } else if (lr.alcance_tipo === "SOCIEDAD" && lr.sociedad_id) {
          societyConditions.push({ id: lr.sociedad_id });
        }
      }
    }

    if (societyConditions.length === 0) {
      return NextResponse.json({ societies: [] });
    }

    // Fetch the societies with detailed connections
    const societies = await prisma.sociedad.findMany({
      where: { OR: societyConditions },
      include: {
        acuerdos: {
          orderBy: { fecha_publicacion: "desc" }
        },
        agenda: {
          orderBy: { fecha: "asc" }
        },
        foro: {
          orderBy: { fecha: "asc" },
          include: {
            usuario: {
              include: {
                persona: true
              }
            }
          }
        },
        inventarios: {
          orderBy: { createdAt: "desc" }
        },
        presupuestos: {
          orderBy: { anio: "desc" }
        },
        asistencias: {
          orderBy: { fecha: "desc" }
        },
        contacto_mensajes: {
          orderBy: { createdAt: "desc" }
        },
        grupos_conexion: {
          include: {
            personas: {
              include: {
                etapa: true,
                historial_tareas: {
                  where: { completada: true },
                },
              },
            },
            asistencias: true,
          },
        },
      },
      orderBy: { orden: "asc" },
    });

    // Compile metrics for each society
    const compiledSocieties = await Promise.all(societies.map(async (soc) => {
      let totalMembers = 0;
      let totalPresent = 0;
      let totalPossibleAttendance = 0;

      // Group summaries
      const groups = soc.grupos_conexion.map((g) => {
        const groupMembersCount = g.personas.length;
        totalMembers += groupMembersCount;

        // Calculate average attendance for this group
        let groupAttendancePct = 0;
        if (g.asistencias.length > 0) {
          let presentSum = 0;
          g.asistencias.forEach((a) => {
            try {
              const presentIds = JSON.parse(a.presentes_ids || "[]");
              presentSum += presentIds.length;
            } catch (e) {
              console.error(e);
            }
          });
          const totalPossible = g.asistencias.length * groupMembersCount;
          groupAttendancePct = totalPossible > 0 ? Math.round((presentSum / totalPossible) * 100) : 0;

          totalPresent += presentSum;
          totalPossibleAttendance += totalPossible;
        }

        return {
          id: g.id,
          nombre_grupo: g.nombre_grupo,
          rango_edad_min: g.rango_edad_min,
          rango_edad_max: g.rango_edad_max,
          miembros_count: groupMembersCount,
          asistencia_promedio: groupAttendancePct,
          asistencias_count: g.asistencias.length,
        };
      });

      // Macro attendance
      const macroAttendancePct = totalPossibleAttendance > 0 
        ? Math.round((totalPresent / totalPossibleAttendance) * 100) 
        : 0;

      // Stage distribution across all groups in this society
      const stageStats: { [key: string]: { name: string; count: number } } = {};
      soc.grupos_conexion.forEach((g) => {
        g.personas.forEach((p) => {
          if (p.etapa) {
            if (!stageStats[p.etapa_id]) {
              stageStats[p.etapa_id] = { name: p.etapa.nombre_etapa, count: 0 };
            }
            stageStats[p.etapa_id].count++;
          }
        });
      });

      // Fetch directiva members of this society
      const directiva = await prisma.liderModulo.findMany({
        where: {
          alcance_tipo: "SOCIEDAD",
          sociedad_id: soc.id
        },
        include: {
          usuario: {
            include: {
              persona: true
            }
          }
        }
      });

      const directivaMapeada = directiva.map(d => {
        const nombre = d.usuario.persona?.nombre || d.usuario.email.split("@")[0];
        return {
          id: d.id,
          nombre,
          email: d.usuario.email,
          rol: d.usuario.rol,
          telefono: d.usuario.persona?.telefono || "Sin teléfono"
        };
      });

      return {
        id: soc.id,
        nombre_sociedad: soc.nombre_sociedad,
        descripcion: soc.descripcion,
        total_grupos: soc.grupos_conexion.length,
        total_miembros: totalMembers,
        asistencia_promedio_macro: macroAttendancePct,
        grupos: groups,
        distribucion_etapas: Object.values(stageStats),
        directiva: directivaMapeada,
        acuerdos: soc.acuerdos,
        inventarios: soc.inventarios,
        presupuestos: soc.presupuestos,
        mensajes: soc.contacto_mensajes || [],
        asistencias: soc.asistencias.map(a => ({
          ...a,
          fecha: a.fecha.toISOString().split("T")[0]
        })),
        agenda: soc.agenda.map(item => ({
          ...item,
          fecha: item.fecha.toISOString().split("T")[0]
        })),
        foro: soc.foro.map(f => {
          const nombreAutor = f.usuario.persona?.nombre || f.usuario.email.split("@")[0];
          return {
            id: f.id,
            comentario: f.comentario,
            fecha: f.fecha,
            autor: nombreAutor
          };
        })
      };
    }));

    return NextResponse.json({
      societies: compiledSocieties,
      userRole: userObj.rol,
    });
  } catch (error: any) {
    console.error("Error in GET /api/sociedad:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Usuario no autorizado" }, { status: 401 });
    }
    const userObj = await prisma.usuario.findUnique({
      where: { id: userId },
      include: { persona: true }
    });

    if (!userObj) {
      return NextResponse.json({ error: "Usuario no autorizado" }, { status: 401 });
    }

    const { action, data } = await request.json();

    switch (action) {
      case "addAcuerdo": {
        const { sociedad_id, titulo, contenido } = data;
        const autorNombre = userObj.persona?.nombre || userObj.email.split("@")[0];
        const newAcuerdo = await prisma.acuerdoSociedad.create({
          data: {
            sociedad_id,
            titulo,
            contenido,
            creado_por: autorNombre
          }
        });
        return NextResponse.json(newAcuerdo);
      }

      case "addAgendaEvent": {
        const { sociedad_id, titulo, descripcion, fecha, hora } = data;
        const newEvent = await prisma.agendaSociedad.create({
          data: {
            sociedad_id,
            titulo,
            descripcion,
            fecha: new Date(fecha),
            hora
          }
        });
        return NextResponse.json(newEvent);
      }

      case "addComment": {
        const { sociedad_id, comentario } = data;
        const newComment = await prisma.foroSociedad.create({
          data: {
            sociedad_id,
            usuario_id: userId,
            comentario
          }
        });
        return NextResponse.json(newComment);
      }

      default:
        return NextResponse.json({ error: "Acción no soportada" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Error in POST /api/sociedad:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
