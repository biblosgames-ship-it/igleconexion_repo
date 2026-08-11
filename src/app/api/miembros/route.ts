import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActiveChurchId } from "@/lib/active-church";

export async function GET() {
  try {
    const defaultIglesiaId = await getActiveChurchId();

    const dbMiembros = await prisma.persona.findMany({
      where: { iglesia_id: defaultIglesiaId },
      select: {
        id: true,
        nombre: true,
        telefono: true,
        correo: true,
        fecha_conversion: true,
        createdAt: true,
        sexo: true,
        fecha_nacimiento: true,
        profesion_oficio: true,
        nivel_academico: true,
        estado_civil: true,
        familia_codigo: true,
        rol_familiar: true,
        etapa_id: true,
        etapa: { select: { nombre_etapa: true } },
        usuario: { select: { id: true, email: true, estado: true } },
        grupo_conexion: {
          select: {
            nombre_grupo: true,
            sociedad: { select: { nombre_sociedad: true } },
          },
        },
        historial_tareas: {
          where: { completada: true },
          select: { tarea_id: true },
        },
        historial_subtareas: {
          where: { completada: true },
          select: { subtarea_id: true },
        },
        etiquetas: {
          where: {
            activa: true,
            OR: [
              { fecha_fin: null },
              { fecha_fin: { gt: new Date() } }
            ]
          },
          select: {
            id: true,
            etiqueta_id: true,
            notas: true,
            fecha_fin: true,
            creado_por: true,
            etiqueta: { select: { nombre: true, color: true, icono: true } }
          }
        }
      },
    });

    const miembros = dbMiembros.map((m) => {
      const msDiff = Date.now() - new Date(m.createdAt).getTime();
      const diasTranscurridos = Math.max(0, Math.floor(msDiff / (1000 * 60 * 60 * 24)));

      return {
        id: m.id,
        nombre: m.nombre,
        telefono: m.telefono || "Sin teléfono",
        correo: m.correo,
        fecha_conversion: m.fecha_conversion,
        avatar: m.sexo === "F" ? "👩" : "👤",
        sociedad: m.grupo_conexion?.sociedad?.nombre_sociedad || "Sociedad General",
        grupo_conexion: m.grupo_conexion?.nombre_grupo || "Grupo General",
        etapa_id: m.etapa_id,
        etapa_nombre: m.etapa.nombre_etapa,
        dias_transcurridos: diasTranscurridos,
        tareas_completadas: m.historial_tareas.map((ht) => ht.tarea_id),
        subtareas_completadas: m.historial_subtareas.map((hs) => hs.subtarea_id),
        usuario: m.usuario ? { id: m.usuario.id, email: m.usuario.email, estado: m.usuario.estado } : null,
        familia_codigo: m.familia_codigo,
        rol_familiar: m.rol_familiar,
        sexo: m.sexo,
        fecha_nacimiento: m.fecha_nacimiento,
        profesion_oficio: m.profesion_oficio || null,
        nivel_academico: m.nivel_academico || null,
        estado_civil: m.estado_civil || null,
        etiquetas: m.etiquetas.map((pe) => ({
          id: pe.id,
          etiqueta_id: pe.etiqueta_id,
          nombre: pe.etiqueta.nombre,
          color: pe.etiqueta.color,
          icono: pe.etiqueta.icono,
          fecha_fin: pe.fecha_fin,
          notas: pe.notas,
          creado_por: pe.creado_por
        })),
      };
    });

    return NextResponse.json(miembros);
  } catch (error: any) {
    console.error("Error in GET /api/miembros:", error);
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
      case "toggleTask": {
        const { memberId, taskId } = data;

        // Buscar si existe el historial de la tarea
        const existing = await prisma.historialTarea.findUnique({
          where: {
            persona_id_tarea_id: {
              persona_id: memberId,
              tarea_id: taskId,
            },
          },
        });

        if (existing) {
          // Cambiar estado
          const updated = await prisma.historialTarea.update({
            where: {
              persona_id_tarea_id: {
                persona_id: memberId,
                tarea_id: taskId,
              },
            },
            data: {
              completada: !existing.completada,
              fecha_completa: !existing.completada ? new Date() : null,
            },
          });
          return NextResponse.json(updated);
        } else {
          // Crear
          const created = await prisma.historialTarea.create({
            data: {
              persona_id: memberId,
              tarea_id: taskId,
              completada: true,
              fecha_completa: new Date(),
            },
          });
          return NextResponse.json(created);
        }
      }

      case "toggleSubtask": {
        const { memberId, taskId, subtaskId } = data;

        // Toggle subtarea
        const existingSub = await prisma.historialSubtarea.findUnique({
          where: {
            persona_id_subtarea_id: {
              persona_id: memberId,
              subtarea_id: subtaskId,
            },
          },
        });

        let subDone = false;

        if (existingSub) {
          await prisma.historialSubtarea.update({
            where: {
              persona_id_subtarea_id: {
                persona_id: memberId,
                subtarea_id: subtaskId,
              },
            },
            data: {
              completada: !existingSub.completada,
            },
          });
          subDone = !existingSub.completada;
        } else {
          await prisma.historialSubtarea.create({
            data: {
              persona_id: memberId,
              subtarea_id: subtaskId,
              completada: true,
            },
          });
          subDone = true;
        }

        // Verificar si todas las subtareas asociadas a esta tarea están completadas
        const allConfigSubs = await prisma.subtareaConfig.findMany({
          where: { tarea_config_id: taskId },
        });

        const completedSubs = await prisma.historialSubtarea.findMany({
          where: {
            persona_id: memberId,
            subtarea: { tarea_config_id: taskId },
            completada: true,
          },
        });

        // Si se han completado todas las subtareas, marcar la tarea como completada automáticamente
        const allCompleted = allConfigSubs.length > 0 && allConfigSubs.every((cs) => completedSubs.some((cps) => cps.subtarea_id === cs.id));

        const existingTask = await prisma.historialTarea.findUnique({
          where: {
            persona_id_tarea_id: {
              persona_id: memberId,
              tarea_id: taskId,
            },
          },
        });

        if (allCompleted) {
          if (!existingTask) {
            await prisma.historialTarea.create({
              data: {
                persona_id: memberId,
                tarea_id: taskId,
                completada: true,
                fecha_completa: new Date(),
              },
            });
          } else if (!existingTask.completada) {
            await prisma.historialTarea.update({
              where: {
                persona_id_tarea_id: {
                  persona_id: memberId,
                  tarea_id: taskId,
                },
              },
              data: {
                completada: true,
                fecha_completa: new Date(),
              },
            });
          }
        } else {
          // Si no están todas completas y antes la tarea estaba completada, desmarcarla
          if (existingTask && existingTask.completada) {
            await prisma.historialTarea.update({
              where: {
                persona_id_tarea_id: {
                  persona_id: memberId,
                  tarea_id: taskId,
                },
              },
              data: {
                completada: false,
                fecha_completa: null,
              },
            });
          }
        }

        return NextResponse.json({ success: true, subDone });
      }

      case "updateDays": {
        const { memberId, increment } = data;

        const member = await prisma.persona.findUnique({
          where: { id: memberId },
        });

        if (!member) {
          return NextResponse.json({ error: "Member not found" }, { status: 404 });
        }

        // Simulamos el paso del tiempo retrocediendo la fecha de creación
        const newCreatedAt = new Date(new Date(member.createdAt).getTime() - increment * 24 * 60 * 60 * 1000);

        const updated = await prisma.persona.update({
          where: { id: memberId },
          data: {
            createdAt: newCreatedAt,
          },
        });

        const msDiff = Date.now() - newCreatedAt.getTime();
        const diasTranscurridos = Math.max(0, Math.floor(msDiff / (1000 * 60 * 60 * 24)));

        return NextResponse.json({ success: true, dias_transcurridos: diasTranscurridos });
      }

      case "addMember": {
        const { nombre, correo, telefono, grupo_conexion_id, etapa_id, sexo, fecha_conversion } = data;
        const defaultIglesiaId = await getActiveChurchId();

        if (!nombre) {
          return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 });
        }

        // Crear persona
        const created = await prisma.persona.create({
          data: {
            iglesia_id: defaultIglesiaId,
            etapa_id: etapa_id,
            grupo_conexion_id: grupo_conexion_id || null,
            nombre: nombre,
            correo: correo || null,
            telefono: telefono || null,
            sexo: sexo || "M",
            fecha_conversion: fecha_conversion ? new Date(fecha_conversion) : null,
          }
        });

        // Crear/vincular usuario si tiene correo
        if (correo) {
          const existingUser = await prisma.usuario.findUnique({
            where: { email: correo }
          });
          if (!existingUser) {
            await prisma.usuario.create({
              data: {
                iglesia_id: defaultIglesiaId,
                email: correo,
                password: "password123",
                rol: "MIEMBRO",
                persona_id: created.id,
              }
            });
          } else {
            await prisma.usuario.update({
              where: { id: existingUser.id },
              data: { persona_id: created.id }
            });
          }
        }

        return NextResponse.json({ success: true, persona: created });
      }

      case "updateEtapa": {
        const { memberId, etapaId } = data;

        const updated = await prisma.persona.update({
          where: { id: memberId },
          data: {
            etapa_id: etapaId,
          },
        });

        return NextResponse.json({ success: true, persona: updated });
      }

      case "updateFamiliaCodigo": {
        const { memberId, familia_codigo } = data;
        const cleanCode = familia_codigo?.trim()?.toUpperCase() || null;

        const updated = await prisma.persona.update({
          where: { id: memberId },
          data: {
            familia_codigo: cleanCode,
          },
        });

        return NextResponse.json({ success: true, persona: updated });
      }

      case "updateMemberDetails": {
        const { memberId, nombre, fecha_nacimiento, sexo, telefono, correo, grupo_conexion_id, grupo_familia_id, etapa_id, familia_codigo } = data;

        const updated = await prisma.persona.update({
          where: { id: memberId },
          data: {
            ...(nombre ? { nombre: nombre.trim() } : {}),
            fecha_nacimiento: fecha_nacimiento ? new Date(fecha_nacimiento) : null,
            sexo: sexo || "M",
            telefono: telefono || null,
            correo: correo || null,
            grupo_conexion_id: grupo_conexion_id || null,
            grupo_familia_id: grupo_familia_id !== undefined ? (grupo_familia_id || null) : undefined,
            ...(etapa_id ? { etapa_id } : {}),
            familia_codigo: familia_codigo?.trim()?.toUpperCase() || null,
          },
        });

        if (correo) {
          const existingUser = await prisma.usuario.findFirst({
            where: { persona_id: memberId }
          });
          if (existingUser && existingUser.email !== correo) {
            await prisma.usuario.update({
              where: { id: existingUser.id },
              data: { email: correo }
            });
          }
        }

        return NextResponse.json({ success: true, persona: updated });
      }

      case "deleteMember": {
        const { memberId } = data;

        // Eliminar dependencias
        await prisma.historialTarea.deleteMany({
          where: { persona_id: memberId }
        });
        await prisma.historialSubtarea.deleteMany({
          where: { persona_id: memberId }
        });
        await prisma.foroComentario.deleteMany({
          where: { persona_id: memberId }
        });
        await prisma.acuerdoConfirmacion.deleteMany({
          where: { persona_id: memberId }
        });

        // Desvincular de usuarios
        await prisma.usuario.updateMany({
          where: { persona_id: memberId },
          data: { persona_id: null }
        });

        const deleted = await prisma.persona.delete({
          where: { id: memberId }
        });

        return NextResponse.json({ success: true, deleted });
      }

      case "bulkDeleteMembers": {
        const { memberIds, grupoId, deleteAllWithoutUser } = data;
        const iglesiaId = await getActiveChurchId();

        let targetIds: string[] = Array.isArray(memberIds) ? memberIds : [];

        if (deleteAllWithoutUser) {
          const personasSinUsuario = await prisma.persona.findMany({
            where: {
              iglesia_id: iglesiaId,
              usuario: null,
              ...(grupoId ? { grupo_conexion_id: grupoId } : {})
            },
            select: { id: true }
          });
          targetIds = personasSinUsuario.map(p => p.id);
        }

        if (targetIds.length === 0) {
          return NextResponse.json({ error: "No se encontraron miembros para eliminar." }, { status: 400 });
        }

        await prisma.historialTarea.deleteMany({ where: { persona_id: { in: targetIds } } });
        await prisma.historialSubtarea.deleteMany({ where: { persona_id: { in: targetIds } } });
        await prisma.foroComentario.deleteMany({ where: { persona_id: { in: targetIds } } });
        await prisma.acuerdoConfirmacion.deleteMany({ where: { persona_id: { in: targetIds } } });
        await prisma.personaEtiqueta.deleteMany({ where: { persona_id: { in: targetIds } } });
        await prisma.asistenteEvento.deleteMany({ where: { persona_id: { in: targetIds } } });

        await prisma.usuario.updateMany({
          where: { persona_id: { in: targetIds } },
          data: { persona_id: null }
        });

        const resDelete = await prisma.persona.deleteMany({
          where: {
            id: { in: targetIds },
            iglesia_id: iglesiaId
          }
        });

        return NextResponse.json({ success: true, count: resDelete.count });
      }

      case "updateUserStatus": {
        const { usuarioId, estado } = data;
        const updated = await prisma.usuario.update({
          where: { id: usuarioId },
          data: { estado }
        });
        return NextResponse.json({ success: true, usuario: updated });
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Error in POST /api/miembros:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
