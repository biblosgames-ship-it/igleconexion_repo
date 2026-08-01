import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActiveChurchId, getSessionUserId } from "@/lib/active-church";
import { PLANS } from "@/lib/plans";

export async function GET() {
  try {
    const defaultIglesiaId = await getActiveChurchId();
    const userId = await getSessionUserId();

    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userObj = await prisma.usuario.findUnique({
      where: { id: userId },
      select: { rol: true, paginas_acceso: true },
    });

    if (!userObj || (userObj.rol !== "ADMIN_IGLESIA" && userObj.rol !== "SUPERADMIN" && userObj.rol !== "LIDER")) {
      return NextResponse.json({ error: "Prohibido: Solo administradores y líderes autorizados" }, { status: 403 });
    }

    if (userObj.rol === "LIDER" && !userObj.paginas_acceso) {
      return NextResponse.json({ error: "Prohibido: Líder sin permisos de menú asignados" }, { status: 403 });
    }

    // Todas las queries en paralelo
    const [etapas, modulos, dbProcesos, sociedades, dbGrupos, dbLideres, dbUsuarios, dbGruposTrabajo] = await Promise.all([
      prisma.etapaConfig.findMany({
        where: { iglesia_id: defaultIglesiaId },
        orderBy: { orden_secuencial: "asc" },
      }),
      prisma.moduloConfig.findMany({
        where: { iglesia_id: defaultIglesiaId },
        orderBy: { orden: "asc" },
      }),
      prisma.tareaConfig.findMany({
        where: { iglesia_id: defaultIglesiaId },
        orderBy: { orden: "asc" },
        include: { subtareas: true },
      }),
      prisma.sociedad.findMany({
        where: { iglesia_id: defaultIglesiaId },
        orderBy: { orden: "asc" },
      }),
      prisma.grupoConexion.findMany({
        where: { sociedad: { iglesia_id: defaultIglesiaId } },
        include: { sociedad: true },
      }),
      prisma.liderModulo.findMany({
        where: { usuario: { iglesia_id: defaultIglesiaId } },
        include: { usuario: { include: { persona: true } }, grupo_trabajo: true },
      }),
      prisma.usuario.findMany({
        where: { iglesia_id: defaultIglesiaId },
        include: {
          persona: true,
          modulos_lider: {
            include: {
              sociedad: true,
              grupo_conexion: true,
              modulo: true,
              grupo_trabajo: true,
            },
          },
        },
        orderBy: { email: "asc" },
      }),
      prisma.grupoTrabajo.findMany({
        where: { iglesia_id: defaultIglesiaId },
        orderBy: { nombre: "asc" },
      }),
    ]);

    // Mapear al formato esperado por el frontend
    const procesos = dbProcesos.map((p) => ({
      id: p.id,
      nombre_tarea: p.nombre_tarea,
      modulo_id: p.modulo_id,
      etapa_id: p.etapa_id,
      dias_limite: p.dias_limite,
      es_obligatoria: p.es_obligatoria,
      subtareas: p.subtareas.map((s) => ({
        id: s.id,
        nombre_subtarea: s.nombre_subtarea,
        dias_limite: s.dias_limite,
      })),
    }));

    const grupos = dbGrupos.map((g) => ({
      id: g.id,
      sociedad_id: g.sociedad_id,
      nombre_grupo: g.nombre_grupo,
      rango_edad_min: g.rango_edad_min,
      rango_edad_max: g.rango_edad_max,
      estado_civil_requerido: g.estado_civil_requerido,
      sexo: (g.sexo || g.sociedad.sexo_requerido) === "M" ? "Masculino" : (g.sexo || g.sociedad.sexo_requerido) === "F" ? "Femenino" : "Mixto",
      sexo_raw: g.sexo || "",
    }));

    const lideres = dbLideres.map((l) => {
      const nombre = l.usuario.persona?.nombre || l.usuario.email.split("@")[0];
      return {
        id: l.id,
        nombre_lider: nombre,
        modulo_id: l.modulo_id || "all",
        alcance_tipo: l.alcance_tipo,
        sociedad_id: l.sociedad_id,
        grupo_conexion_id: l.grupo_conexion_id,
        grupo_trabajo_id: l.grupo_trabajo_id,
        grupo_trabajo_nombre: l.grupo_trabajo?.nombre || "",
      };
    });

    const usuarios = dbUsuarios.map((u) => {
      const nombre = u.persona?.nombre || u.email.split("@")[0];
      return {
        id: u.id,
        email: u.email,
        rol: u.rol,
        estado: u.estado,
        paginas_acceso: u.paginas_acceso || "",
        persona: u.persona ? {
          id: u.persona.id,
          nombre: u.persona.nombre,
          foto_url: u.persona.foto_url,
        } : null,
        directivas: u.modulos_lider.map((ml) => ({
          id: ml.id,
          alcance_tipo: ml.alcance_tipo,
          modulo_id: ml.modulo_id,
          modulo_nombre: ml.modulo?.nombre_modulo || "Todos los Módulos",
          sociedad_id: ml.sociedad_id,
          sociedad_nombre: ml.sociedad?.nombre_sociedad || "",
          grupo_conexion_id: ml.grupo_conexion_id,
          grupo_conexion_nombre: ml.grupo_conexion?.nombre_grupo || "",
          grupo_trabajo_id: ml.grupo_trabajo_id,
          grupo_trabajo_nombre: ml.grupo_trabajo?.nombre || "",
        })),
      };
    });

    const gruposTrabajo = dbGruposTrabajo.map(g => ({
      id: g.id,
      nombre: g.nombre,
      tipo: g.tipo,
      descripcion: g.descripcion
    }));

    return NextResponse.json({
      etapas,
      modulos,
      procesos,
      sociedades,
      grupos,
      lideres,
      usuarios,
      gruposTrabajo,
    });
  } catch (error: any) {
    console.error("Error in GET /api/admin:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userObj = await prisma.usuario.findUnique({
      where: { id: userId },
      select: { rol: true, paginas_acceso: true },
    });

    if (!userObj || (userObj.rol !== "ADMIN_IGLESIA" && userObj.rol !== "SUPERADMIN" && userObj.rol !== "LIDER")) {
      return NextResponse.json({ error: "Prohibido: Solo administradores y líderes autorizados" }, { status: 403 });
    }

    if (userObj.rol === "LIDER" && !userObj.paginas_acceso) {
      return NextResponse.json({ error: "Prohibido: Líder sin permisos de menú asignados" }, { status: 403 });
    }

    const body = await request.json();
    const { action, data } = body;
    const defaultIglesiaId = await getActiveChurchId();

    if (!action) {
      return NextResponse.json({ error: "Missing action" }, { status: 400 });
    }

    switch (action) {
      case "addEtapa": {
        const { nombre_etapa, orden_secuencial } = data;
        
        let finalOrder = orden_secuencial ? parseInt(orden_secuencial) : null;

        if (!finalOrder) {
          const maxEtapa = await prisma.etapaConfig.findFirst({
            where: { iglesia_id: defaultIglesiaId },
            orderBy: { orden_secuencial: "desc" },
          });
          finalOrder = maxEtapa ? maxEtapa.orden_secuencial + 1 : 1;
        } else {
          // Desplazar las existentes de forma descendente para hacer espacio
          const stagesToShift = await prisma.etapaConfig.findMany({
            where: {
              iglesia_id: defaultIglesiaId,
              orden_secuencial: { gte: finalOrder },
            },
            orderBy: { orden_secuencial: "desc" },
          });

          for (const stg of stagesToShift) {
            await prisma.etapaConfig.update({
              where: { id: stg.id },
              data: { orden_secuencial: stg.orden_secuencial + 1 },
            });
          }
        }

        // Limpiar prefijo "Etapa X: " anterior si existe y formatearlo con el orden final
        const cleanName = nombre_etapa.replace(/^Etapa \d+:\s*/i, "");
        const formattedName = `Etapa ${finalOrder}: ${cleanName}`;

        const newEtapa = await prisma.etapaConfig.create({
          data: {
            iglesia_id: defaultIglesiaId,
            nombre_etapa: formattedName,
            orden_secuencial: finalOrder,
          },
        });
        return NextResponse.json(newEtapa);
      }

      case "deleteEtapa": {
        const { id } = data;
        await prisma.etapaConfig.delete({
          where: { id },
        });
        return NextResponse.json({ success: true });
      }

      case "updateEtapa": {
        const { id, nombre_etapa, orden_secuencial } = data;
        const currentEtapa = await prisma.etapaConfig.findUnique({ where: { id } });
        if (!currentEtapa) return NextResponse.json({ error: "Etapa no encontrada" }, { status: 404 });
        
        let finalOrder = orden_secuencial ? parseInt(orden_secuencial) : currentEtapa.orden_secuencial;
        const cleanName = nombre_etapa.replace(/^Etapa \d+:\s*/i, "");
        const formattedName = `Etapa ${finalOrder}: ${cleanName}`;

        const updated = await prisma.etapaConfig.update({
          where: { id },
          data: {
            nombre_etapa: formattedName,
            orden_secuencial: finalOrder,
          },
        });
        return NextResponse.json(updated);
      }

      case "addModulo": {
        const { nombre_modulo } = data;
        const maxModulo = await prisma.moduloConfig.findFirst({
          where: { iglesia_id: defaultIglesiaId },
          orderBy: { orden: "desc" },
        });
        const nextOrder = maxModulo ? maxModulo.orden + 1 : 1;

        const newModulo = await prisma.moduloConfig.create({
          data: {
            iglesia_id: defaultIglesiaId,
            nombre_modulo,
            orden: nextOrder,
          },
        });
        return NextResponse.json(newModulo);
      }

      case "deleteModulo": {
        const { id } = data;
        await prisma.moduloConfig.delete({
          where: { id },
        });
        return NextResponse.json({ success: true });
      }

      case "updateModulo": {
        const { id, nombre_modulo } = data;
        const updated = await prisma.moduloConfig.update({
          where: { id },
          data: { nombre_modulo },
        });
        return NextResponse.json(updated);
      }

      case "addProcess": {
        const { nombre_tarea, modulo_id, etapa_id, dias_limite, es_obligatoria, subtareas } = data;
        
        // Calcular el próximo orden secuencial
        const maxTask = await prisma.tareaConfig.findFirst({
          where: { iglesia_id: defaultIglesiaId },
          orderBy: { orden: "desc" },
        });
        const nextOrder = maxTask ? maxTask.orden + 1 : 1;

        const newProcess = await prisma.tareaConfig.create({
          data: {
            iglesia_id: defaultIglesiaId,
            nombre_tarea,
            modulo_id,
            etapa_id: etapa_id || null,
            dias_limite: dias_limite ? parseInt(dias_limite) : null,
            es_obligatoria: !!es_obligatoria,
            orden: nextOrder,
            subtareas: {
              create: (subtareas || []).map((sub: any) => ({
                nombre_subtarea: sub.nombre_subtarea,
                dias_limite: sub.dias_limite ? parseInt(sub.dias_limite) : null,
              })),
            },
          },
          include: {
            subtareas: true,
          },
        });
        return NextResponse.json(newProcess);
      }

      case "reorderProcesses": {
        const { processes } = data;
        if (!Array.isArray(processes)) {
          return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
        }

        // Actualizar el orden de cada tarea secuencialmente en una transacción
        await prisma.$transaction(
          processes.map((p: any) =>
            prisma.tareaConfig.update({
              where: { id: p.id },
              data: { orden: p.orden },
            })
          )
        );

        return NextResponse.json({ success: true });
      }

      case "reorderSociedades": {
        const { sociedades } = data;
        if (!Array.isArray(sociedades)) {
          return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
        }

        await prisma.$transaction(
          sociedades.map((s: any) =>
            prisma.sociedad.update({
              where: { id: s.id },
              data: { orden: s.orden },
            })
          )
        );

        return NextResponse.json({ success: true });
      }

      case "reorderModulos": {
        const { modulos } = data;
        if (!Array.isArray(modulos)) {
          return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
        }

        await prisma.$transaction(
          modulos.map((m: any) =>
            prisma.moduloConfig.update({
              where: { id: m.id },
              data: { orden: m.orden },
            })
          )
        );

        return NextResponse.json({ success: true });
      }

      case "deleteProcess": {
        const { id } = data;
        await prisma.tareaConfig.delete({
          where: { id },
        });
        return NextResponse.json({ success: true });
      }

      case "updateProcess": {
        const { id, nombre_tarea, dias_limite, es_obligatoria, subtareas } = data;
        const updated = await prisma.tareaConfig.update({
          where: { id },
          data: {
            nombre_tarea,
            dias_limite: (dias_limite !== null && dias_limite !== undefined && dias_limite !== "") ? parseInt(String(dias_limite)) : null,
            es_obligatoria: !!es_obligatoria,
          },
        });

        if (Array.isArray(subtareas)) {
          const existingSubtasks = await prisma.subtareaConfig.findMany({
            where: { tarea_config_id: id },
          });
          const existingIds = existingSubtasks.map(s => s.id);
          const incomingIds = subtareas.map((s: any) => s.id).filter(Boolean) as string[];

          const toDelete = existingIds.filter(eid => !incomingIds.includes(eid));
          if (toDelete.length > 0) {
            await prisma.subtareaConfig.deleteMany({
              where: { id: { in: toDelete } },
            });
          }

          for (const sub of subtareas) {
            const days = (sub.dias_limite !== null && sub.dias_limite !== undefined && sub.dias_limite !== "") 
              ? parseInt(String(sub.dias_limite)) 
              : null;
              
            if (sub.id) {
              await prisma.subtareaConfig.update({
                where: { id: sub.id },
                data: {
                  nombre_subtarea: sub.nombre_subtarea.trim(),
                  dias_limite: days,
                },
              });
            } else {
              await prisma.subtareaConfig.create({
                data: {
                  tarea_config_id: id,
                  nombre_subtarea: sub.nombre_subtarea.trim(),
                  dias_limite: days,
                },
              });
            }
          }
        }

        return NextResponse.json(updated);
      }

      case "linkProcess": {
        const { stageId, processId } = data;
        const updated = await prisma.tareaConfig.update({
          where: { id: processId },
          data: { etapa_id: stageId },
        });
        return NextResponse.json(updated);
      }

      case "unlinkProcess": {
        const { processId } = data;
        const updated = await prisma.tareaConfig.update({
          where: { id: processId },
          data: { etapa_id: null },
        });
        return NextResponse.json(updated);
      }

      case "updateChurchEvents": {
        const { eventos } = data;
        const updated = await prisma.iglesia.update({
          where: { id: defaultIglesiaId },
          data: {
            eventos: eventos ? JSON.stringify(eventos) : null,
          },
        });
        return NextResponse.json(updated);
      }

      case "addSociedad": {
        const { nombre_sociedad, rango_edad_min, rango_edad_max, sexo_requerido, logo_url } = data;
        const newSoc = await prisma.sociedad.create({
          data: {
            iglesia_id: defaultIglesiaId,
            nombre_sociedad,
            rango_edad_min: rango_edad_min ? parseInt(rango_edad_min) : null,
            rango_edad_max: rango_edad_max ? parseInt(rango_edad_max) : null,
            sexo_requerido: sexo_requerido || "MIXTO",
            logo_url: logo_url || null,
          },
        });
        return NextResponse.json(newSoc);
      }

      case "updateSociedadLogo": {
        const { id, logo_url } = data;
        const updatedSoc = await prisma.sociedad.update({
          where: { id },
          data: {
            logo_url: logo_url || null,
          },
        });
        return NextResponse.json(updatedSoc);
      }

      case "updateSociedadDetalles": {
        const { id, descripcion, horarios, galeria, rango_edad_min, rango_edad_max, sexo_requerido } = data;
        const updatedSoc = await prisma.sociedad.update({
          where: { id },
          data: {
            descripcion: descripcion || null,
            horarios: horarios || null,
            galeria: galeria || null,
            rango_edad_min: rango_edad_min !== undefined && rango_edad_min !== null && rango_edad_min !== "" ? parseInt(rango_edad_min) : null,
            rango_edad_max: rango_edad_max !== undefined && rango_edad_max !== null && rango_edad_max !== "" ? parseInt(rango_edad_max) : null,
            sexo_requerido: sexo_requerido || "MIXTO",
          },
        });
        return NextResponse.json(updatedSoc);
      }

      case "deleteSociedad": {
        const { id } = data;
        await prisma.sociedad.delete({
          where: { id },
        });
        return NextResponse.json({ success: true });
      }

      case "addGroup": {
        const { sociedad_id, nombre_grupo, rango_edad_min, rango_edad_max, estado_civil_requerido, sexo } = data;
        const newGroup = await prisma.grupoConexion.create({
          data: {
            sociedad_id,
            nombre_grupo,
            rango_edad_min: rango_edad_min ? parseInt(rango_edad_min) : null,
            rango_edad_max: rango_edad_max ? parseInt(rango_edad_max) : null,
            estado_civil_requerido: estado_civil_requerido || null,
            sexo: sexo || null,
          },
        });
        return NextResponse.json(newGroup);
      }

      case "deleteGroup": {
        const { id } = data;
        await prisma.grupoConexion.delete({
          where: { id },
        });
        return NextResponse.json({ success: true });
      }

      case "updateGroup": {
        const { id, nombre_grupo, rango_edad_min, rango_edad_max, estado_civil_requerido, sexo } = data;
        const updated = await prisma.grupoConexion.update({
          where: { id },
          data: {
            nombre_grupo,
            rango_edad_min: rango_edad_min ? parseInt(rango_edad_min) : null,
            rango_edad_max: rango_edad_max ? parseInt(rango_edad_max) : null,
            estado_civil_requerido: estado_civil_requerido || null,
            sexo: sexo || null,
          },
        });
        return NextResponse.json(updated);
      }

      case "addLider": {
        const { nombre_lider, modulo_id, alcance_tipo, sociedad_id, grupo_conexion_id, grupo_trabajo_id, rol, paginas_acceso } = data;
        const targetRol = rol || "LIDER";
        const targetPages = Array.isArray(paginas_acceso) ? paginas_acceso.join(",") : (paginas_acceso || null);

        // Intentar encontrar una persona con ese nombre o crearla
        let persona = await prisma.persona.findFirst({
          where: { nombre: nombre_lider, iglesia_id: defaultIglesiaId },
        });

        // Validar límites del Plan SaaS
        const iglesia = await prisma.iglesia.findUnique({
          where: { id: defaultIglesiaId },
        });

        if (iglesia) {
          if (!persona) {
            const firstStage = await prisma.etapaConfig.findFirst({
              where: {
                iglesia_id: defaultIglesiaId,
                orden_secuencial: 1
              }
            });

            const currentMembersCount = await prisma.persona.count({
              where: {
                iglesia_id: defaultIglesiaId,
                ...(firstStage ? { NOT: { etapa_id: firstStage.id } } : {})
              },
            });
            if (currentMembersCount >= iglesia.limite_personas) {
              return NextResponse.json({
                error: `Límite de miembros alcanzado. Tu iglesia tiene un límite de ${iglesia.limite_personas} miembros oficiales (Plan ${iglesia.plan}). Por favor, actualiza tu plan o límites en la Consola SaaS.`,
              }, { status: 403 });
            }
          }

          // Validar límite de líderes únicos
          const uniqueLeaders = await prisma.liderModulo.findMany({
            where: {
              usuario: {
                iglesia_id: defaultIglesiaId
              }
            },
            distinct: ['usuario_id']
          });

          const userEmail = `${nombre_lider.toLowerCase().replace(/\s+/g, "")}@igleconexion.com`;
          const existingUser = await prisma.usuario.findUnique({
            where: { email: userEmail },
          });

          let isAlreadyLeader = false;
          if (existingUser) {
            isAlreadyLeader = uniqueLeaders.some(ul => ul.usuario_id === existingUser.id);
          }

          if (!isAlreadyLeader) {
            if (uniqueLeaders.length >= iglesia.limite_usuarios) {
              return NextResponse.json({
                error: `Límite de líderes alcanzado. Tu iglesia tiene un límite de ${iglesia.limite_usuarios} líderes únicos (Plan ${iglesia.plan}). Por favor, actualiza tu plan o límites en la Consola SaaS.`,
              }, { status: 403 });
            }
          }
        }

        if (!persona) {
          persona = await prisma.persona.create({
            data: {
              iglesia_id: defaultIglesiaId,
              nombre: nombre_lider,
              etapa_id: "etapa-3", // Por defecto en la última etapa si es líder
            },
          });
        }

        // Intentar encontrar un usuario asociado a la persona por su persona_id
        let usuario = await prisma.usuario.findFirst({
          where: { persona_id: persona.id },
        });

        const generatedEmail = `${nombre_lider.toLowerCase().replace(/\s+/g, "")}@igleconexion.com`;

        // Si no se encuentra por persona_id, intentar por email generado
        if (!usuario) {
          usuario = await prisma.usuario.findUnique({
            where: { email: generatedEmail },
          });
        }

        if (!usuario) {
          usuario = await prisma.usuario.create({
            data: {
              iglesia_id: defaultIglesiaId,
              email: generatedEmail,
              password: "password123",
              rol: targetRol,
              persona_id: persona.id,
              paginas_acceso: targetPages,
            },
          });
        } else {
          // Si el usuario existe pero no está vinculado a esta persona, intentamos vincularlo
          if (!usuario.persona_id) {
            usuario = await prisma.usuario.update({
              where: { id: usuario.id },
              data: { persona_id: persona.id },
            });
          }
          
          // Siempre promovemos o actualizamos el rol y permisos de menú
          usuario = await prisma.usuario.update({
            where: { id: usuario.id },
            data: { 
              rol: targetRol,
              paginas_acceso: targetPages,
            },
          });
        }

        const moduleIdsToAssign = Array.isArray(data.modulo_ids)
          ? data.modulo_ids
          : [modulo_id];

        const createdLiders = [];
        if (moduleIdsToAssign.includes("all") || moduleIdsToAssign.length === 0) {
          // Buscar si ya tiene una asignación de "todos los módulos"
          const existing = await prisma.liderModulo.findFirst({
            where: {
              usuario_id: usuario.id,
              modulo_id: null,
            },
          });

          if (existing) {
            const updated = await prisma.liderModulo.update({
              where: { id: existing.id },
              data: {
                alcance_tipo,
                sociedad_id: (alcance_tipo === "SOCIEDAD" && sociedad_id) ? sociedad_id : null,
                grupo_conexion_id: (alcance_tipo === "GRUPO_CONEXION" && grupo_conexion_id) ? grupo_conexion_id : null,
                grupo_trabajo_id: (["CUERPO_OFICIAL", "DEPARTAMENTO", "MINISTERIO", "INSTITUCION"].includes(alcance_tipo) && grupo_trabajo_id) ? grupo_trabajo_id : null,
              },
            });
            createdLiders.push(updated);
          } else {
            const newLider = await prisma.liderModulo.create({
              data: {
                usuario_id: usuario.id,
                modulo_id: null,
                alcance_tipo,
                sociedad_id: (alcance_tipo === "SOCIEDAD" && sociedad_id) ? sociedad_id : null,
                grupo_conexion_id: (alcance_tipo === "GRUPO_CONEXION" && grupo_conexion_id) ? grupo_conexion_id : null,
                grupo_trabajo_id: (["CUERPO_OFICIAL", "DEPARTAMENTO", "MINISTERIO", "INSTITUCION"].includes(alcance_tipo) && grupo_trabajo_id) ? grupo_trabajo_id : null,
              },
            });
            createdLiders.push(newLider);
          }
        } else {
          for (const modId of moduleIdsToAssign) {
            const mId = (modId && modId !== "all") ? modId : null;
            const existing = await prisma.liderModulo.findFirst({
              where: {
                usuario_id: usuario.id,
                modulo_id: mId,
              },
            });

            if (existing) {
              const updated = await prisma.liderModulo.update({
                where: { id: existing.id },
                data: {
                  alcance_tipo,
                  sociedad_id: (alcance_tipo === "SOCIEDAD" && sociedad_id) ? sociedad_id : null,
                  grupo_conexion_id: (alcance_tipo === "GRUPO_CONEXION" && grupo_conexion_id) ? grupo_conexion_id : null,
                  grupo_trabajo_id: (["CUERPO_OFICIAL", "DEPARTAMENTO", "MINISTERIO", "INSTITUCION"].includes(alcance_tipo) && grupo_trabajo_id) ? grupo_trabajo_id : null,
                },
              });
              createdLiders.push(updated);
            } else {
              const newLider = await prisma.liderModulo.create({
                data: {
                  usuario_id: usuario.id,
                  modulo_id: mId,
                  alcance_tipo,
                  sociedad_id: (alcance_tipo === "SOCIEDAD" && sociedad_id) ? sociedad_id : null,
                  grupo_conexion_id: (alcance_tipo === "GRUPO_CONEXION" && grupo_conexion_id) ? grupo_conexion_id : null,
                  grupo_trabajo_id: (["CUERPO_OFICIAL", "DEPARTAMENTO", "MINISTERIO", "INSTITUCION"].includes(alcance_tipo) && grupo_trabajo_id) ? grupo_trabajo_id : null,
                },
              });
              createdLiders.push(newLider);
            }
          }
        }

        const primaryLider = createdLiders[0];

        return NextResponse.json({
          id: primaryLider.id,
          nombre_lider: persona.nombre,
          modulo_id: primaryLider.modulo_id || "all",
          alcance_tipo: primaryLider.alcance_tipo,
          sociedad_id: primaryLider.sociedad_id,
          grupo_conexion_id: primaryLider.grupo_conexion_id,
          allCreated: createdLiders
        });
      }

      case "updateLider": {
        const { id, modulo_ids, alcance_tipo, sociedad_id, grupo_conexion_id } = data;

        const current = await prisma.liderModulo.findUnique({
          where: { id },
        });

        if (!current) {
          return NextResponse.json({ error: "Líder no encontrado" }, { status: 404 });
        }

        const usuarioId = current.usuario_id;

        // Eliminar el registro original para recrearlo según los nuevos módulos seleccionados
        await prisma.liderModulo.delete({
          where: { id },
        });

        const moduleIdsToAssign = Array.isArray(modulo_ids)
          ? modulo_ids
          : ["all"];

        const createdLiders = [];
        if (moduleIdsToAssign.includes("all") || moduleIdsToAssign.length === 0) {
          const existing = await prisma.liderModulo.findFirst({
            where: {
              usuario_id: usuarioId,
              modulo_id: null,
            },
          });

          if (existing) {
            const updated = await prisma.liderModulo.update({
              where: { id: existing.id },
              data: {
                alcance_tipo,
                sociedad_id: (alcance_tipo === "SOCIEDAD" && sociedad_id) ? sociedad_id : null,
                grupo_conexion_id: (alcance_tipo === "GRUPO_CONEXION" && grupo_conexion_id) ? grupo_conexion_id : null,
              },
            });
            createdLiders.push(updated);
          } else {
            const newLider = await prisma.liderModulo.create({
              data: {
                usuario_id: usuarioId,
                modulo_id: null,
                alcance_tipo,
                sociedad_id: (alcance_tipo === "SOCIEDAD" && sociedad_id) ? sociedad_id : null,
                grupo_conexion_id: (alcance_tipo === "GRUPO_CONEXION" && grupo_conexion_id) ? grupo_conexion_id : null,
              },
            });
            createdLiders.push(newLider);
          }
        } else {
          for (const modId of moduleIdsToAssign) {
            const mId = (modId && modId !== "all") ? modId : null;
            const existing = await prisma.liderModulo.findFirst({
              where: {
                usuario_id: usuarioId,
                modulo_id: mId,
              },
            });

            if (existing) {
              const updated = await prisma.liderModulo.update({
                where: { id: existing.id },
                data: {
                  alcance_tipo,
                  sociedad_id: (alcance_tipo === "SOCIEDAD" && sociedad_id) ? sociedad_id : null,
                  grupo_conexion_id: (alcance_tipo === "GRUPO_CONEXION" && grupo_conexion_id) ? grupo_conexion_id : null,
                },
              });
              createdLiders.push(updated);
            } else {
              const newLider = await prisma.liderModulo.create({
                data: {
                  usuario_id: usuarioId,
                  modulo_id: mId,
                  alcance_tipo,
                  sociedad_id: (alcance_tipo === "SOCIEDAD" && sociedad_id) ? sociedad_id : null,
                  grupo_conexion_id: (alcance_tipo === "GRUPO_CONEXION" && grupo_conexion_id) ? grupo_conexion_id : null,
                },
              });
              createdLiders.push(newLider);
            }
          }
        }

        return NextResponse.json({ success: true, allCreated: createdLiders });
      }

      case "bulkImportMiembros": {
        const { rows, grupo_conexion_id } = data; // Array of { sociedadName, grupoName, nombre, correo, telefono, sexo, edad }
        const defaultIglesiaId = await getActiveChurchId();

        // Encontrar Etapa 2 (Nuevo Creyente) como predeterminada
        const etapa = await prisma.etapaConfig.findFirst({
          where: {
            iglesia_id: defaultIglesiaId,
            orden_secuencial: 2,
          },
        });
        const etapaId = etapa ? etapa.id : "etapa-2";

        const imported = [];
        const errors = [];

        for (const row of rows) {
          try {
            const { sociedadName, grupoName, nombre, correo, telefono, sexo, edad } = row;
            if (!nombre || !nombre.trim()) continue;

            // Evitar duplicados por correo o teléfono
            let existing = null;
            if (correo && correo.trim()) {
              existing = await prisma.persona.findFirst({
                where: { correo: correo.trim(), iglesia_id: defaultIglesiaId }
              });
            }
            if (!existing && telefono && telefono.trim()) {
              existing = await prisma.persona.findFirst({
                where: { telefono: telefono.trim(), iglesia_id: defaultIglesiaId }
              });
            }

            // Calcular fecha de nacimiento aproximada a partir de la edad
            let fechaNac = null;
            if (edad) {
              const ageVal = parseInt(edad);
              if (!isNaN(ageVal)) {
                const currentYear = new Date().getFullYear();
                const birthYear = currentYear - ageVal;
                fechaNac = new Date(`${birthYear}-01-01`);
              }
            }

            // Buscar grupo de conexión por nombre o usar el asignado
            let grupoId = grupo_conexion_id || null;
            if (!grupoId && grupoName && grupoName.trim()) {
              // Buscar primero sociedad si se especificó
              let socId = null;
              if (sociedadName && sociedadName.trim()) {
                const soc = await prisma.sociedad.findFirst({
                  where: {
                    nombre_sociedad: {
                      contains: sociedadName.trim()
                    },
                    iglesia_id: defaultIglesiaId
                  }
                });
                if (soc) socId = soc.id;
              }

              const grupo = await prisma.grupoConexion.findFirst({
                where: {
                  nombre_grupo: {
                    contains: grupoName.trim()
                  },
                  sociedad: socId ? { id: socId } : { iglesia_id: defaultIglesiaId }
                }
              });
              if (grupo) {
                grupoId = grupo.id;
              }
            }

            // Si no se especificó o no se encontró el grupo, hacer asignación automática por edad y sexo
            if (!grupoId && sexo && edad) {
              const ageVal = parseInt(edad);
              const cleanSexo = sexo.trim().toUpperCase();
              if (!isNaN(ageVal)) {
                const matchedGroup = await prisma.grupoConexion.findFirst({
                  where: {
                    rango_edad_min: { lte: ageVal },
                    rango_edad_max: { gte: ageVal },
                    sexo: { in: ["MIXTO", cleanSexo] },
                    sociedad: { iglesia_id: defaultIglesiaId }
                  }
                });
                if (matchedGroup) {
                  grupoId = matchedGroup.id;
                }
              }
            }

            if (existing) {
              // Actualizar perfil
              const updated = await prisma.persona.update({
                where: { id: existing.id },
                data: {
                  nombre: nombre.trim(),
                  correo: correo ? correo.trim() : existing.correo,
                  telefono: telefono ? telefono.trim() : existing.telefono,
                  whatsapp: telefono ? telefono.trim() : existing.whatsapp,
                  sexo: sexo ? sexo.trim().toUpperCase() : existing.sexo,
                  fecha_nacimiento: fechaNac || existing.fecha_nacimiento,
                  grupo_conexion_id: grupoId || existing.grupo_conexion_id,
                }
              });
              imported.push(updated);
            } else {
              // Crear nuevo perfil de Persona (sin cuenta de usuario)
              const created = await prisma.persona.create({
                data: {
                  iglesia_id: defaultIglesiaId,
                  etapa_id: etapaId,
                  nombre: nombre.trim(),
                  correo: correo ? correo.trim() : null,
                  telefono: telefono ? telefono.trim() : null,
                  whatsapp: telefono ? telefono.trim() : null,
                  sexo: sexo ? sexo.trim().toUpperCase() : "MIXTO",
                  fecha_nacimiento: fechaNac,
                  grupo_conexion_id: grupoId,
                }
              });
              imported.push(created);
            }
          } catch (e: any) {
            errors.push({ name: row.nombre || "Desconocido", error: e.message });
          }
        }

        return NextResponse.json({ success: true, count: imported.length, errors });
      }

      case "deleteLider": {
        const { id } = data;
        await prisma.liderModulo.delete({
          where: { id },
        });
        return NextResponse.json({ success: true });
      }

      case "addLiderDirectiva": {
        const { usuario_id, modulo_ids, alcance_tipo, sociedad_id, grupo_conexion_id, grupo_trabajo_id } = data;
        const moduleIdsToAssign = Array.isArray(modulo_ids) ? modulo_ids : ["all"];
 
        const userObj = await prisma.usuario.findUnique({
          where: { id: usuario_id }
        });
        if (!userObj) {
          return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
        }
 
        // Validar límite de líderes únicos
        const uniqueLeaders = await prisma.liderModulo.findMany({
          where: {
            usuario: {
              iglesia_id: defaultIglesiaId
            }
          },
          distinct: ['usuario_id']
        });
 
        const isAlreadyLeader = uniqueLeaders.some(ul => ul.usuario_id === usuario_id);
        if (!isAlreadyLeader) {
          const iglesia = await prisma.iglesia.findUnique({
            where: { id: defaultIglesiaId }
          });
          if (iglesia && uniqueLeaders.length >= iglesia.limite_usuarios) {
            return NextResponse.json({
              error: `Límite de líderes alcanzado. Tu iglesia tiene un límite de ${iglesia.limite_usuarios} líderes únicos (Plan ${iglesia.plan}). Por favor, actualiza tu plan o límites en la Consola SaaS.`,
            }, { status: 403 });
          }
        }
 
        // Upgrade MIEMBRO to LIDER if necessary
        if (userObj.rol === "MIEMBRO") {
          await prisma.usuario.update({
            where: { id: usuario_id },
            data: { rol: "LIDER" }
          });
        }
 
        const created = [];
        for (const modId of moduleIdsToAssign) {
          const mId = (modId && modId !== "all") ? modId : null;
          
          const existing = await prisma.liderModulo.findFirst({
            where: {
              usuario_id,
              modulo_id: mId,
              alcance_tipo,
              sociedad_id: (alcance_tipo === "SOCIEDAD" && sociedad_id) ? sociedad_id : null,
              grupo_conexion_id: (alcance_tipo === "GRUPO_CONEXION" && grupo_conexion_id) ? grupo_conexion_id : null,
              grupo_trabajo_id: (["CUERPO_OFICIAL", "DEPARTAMENTO", "MINISTERIO", "INSTITUCION"].includes(alcance_tipo) && grupo_trabajo_id) ? grupo_trabajo_id : null,
            }
          });
 
          if (!existing) {
            const newLid = await prisma.liderModulo.create({
              data: {
                usuario_id,
                modulo_id: mId,
                alcance_tipo,
                sociedad_id: (alcance_tipo === "SOCIEDAD" && sociedad_id) ? sociedad_id : null,
                grupo_conexion_id: (alcance_tipo === "GRUPO_CONEXION" && grupo_conexion_id) ? grupo_conexion_id : null,
                grupo_trabajo_id: (["CUERPO_OFICIAL", "DEPARTAMENTO", "MINISTERIO", "INSTITUCION"].includes(alcance_tipo) && grupo_trabajo_id) ? grupo_trabajo_id : null,
              }
            });
            created.push(newLid);
          }
        }
        return NextResponse.json({ success: true, count: created.length });
      }

      case "removeLiderDirectiva": {
        const { id } = data;
        await prisma.liderModulo.delete({
          where: { id }
        });
        return NextResponse.json({ success: true });
      }

      case "updateUsuarioRoleStatus": {
        const { usuario_id, rol, estado, paginas_acceso } = data;
        const targetPages = Array.isArray(paginas_acceso) ? paginas_acceso.join(",") : (paginas_acceso || null);
        await prisma.usuario.update({
          where: { id: usuario_id },
          data: {
            rol,
            estado,
            paginas_acceso: targetPages
          }
        });
        return NextResponse.json({ success: true });
      }

      case "revokeLiderCompleto": {
        const { usuario_id } = data;
        
        await prisma.liderModulo.deleteMany({
          where: { usuario_id },
        });

        await prisma.usuario.update({
          where: { id: usuario_id },
          data: { rol: "MIEMBRO" },
        });

        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Error in POST /api/admin:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
