import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { getActiveChurchId, getSessionUserId } from "@/lib/active-church";

// Helper to ensure SuperAdmin exists in database
async function ensureSuperAdminExists() {
  let superAdmin = await prisma.usuario.findFirst({
    where: { rol: "SUPERADMIN" }
  });
  if (!superAdmin) {
    let defaultChurch = await prisma.iglesia.findFirst();
    if (!defaultChurch) {
      defaultChurch = await prisma.iglesia.create({
        data: {
          id: "iglesia-default",
          nombre_iglesia: "Mi Iglesia Local",
          subdominio_o_slug: "primerahiguey"
        }
      });
    }
    superAdmin = await prisma.usuario.create({
      data: {
        iglesia_id: defaultChurch.id,
        email: "alexpalacio29@gmail.com",
        password: "superpassword",
        rol: "SUPERADMIN"
      }
    });
  }
  return superAdmin;
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionUserId = cookieStore.get("session_user_id")?.value;
    const activeChurchId = await getActiveChurchId();
    const viewingAsRole = cookieStore.get("viewing_as_role")?.value;

    if (!sessionUserId) {
      return NextResponse.json({ error: "No ha iniciado sesión" }, { status: 401 });
    }

    let user = await prisma.usuario.findUnique({
      where: { id: sessionUserId },
      select: {
        id: true,
        iglesia_id: true,
        email: true,
        password: true,
        rol: true,
        estado: true,
        persona_id: true,
        paginas_acceso: true,
        persona: {
          select: {
            id: true,
            nombre: true,
            telefono: true,
            fecha_nacimiento: true,
            sexo: true,
            foto_url: true,
            correo: true,
            etapa_id: true,
            etapa: { select: { nombre_etapa: true } },
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
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Auto-link persona for superadmin/admin if missing - search strictly in searchChurchId
    if ((user.rol === "SUPERADMIN" || user.rol === "ADMIN_IGLESIA") && !user.persona_id) {
      const searchChurchId = activeChurchId || user.iglesia_id;

      // Search exact email in current church
      let foundPersona = await prisma.persona.findFirst({
        where: { iglesia_id: searchChurchId, correo: user.email },
      });

      if (foundPersona) {
        await prisma.usuario.update({
          where: { id: user.id },
          data: { persona_id: foundPersona.id },
        });
        user.persona_id = foundPersona.id;
        const fullPersona = await prisma.persona.findUnique({
          where: { id: foundPersona.id },
          select: {
            id: true, nombre: true, telefono: true, fecha_nacimiento: true,
            sexo: true, foto_url: true, correo: true, etapa_id: true,
            etapa: { select: { nombre_etapa: true } },
            grupo_conexion: { select: { nombre_grupo: true, sociedad: { select: { nombre_sociedad: true } } } },
            historial_tareas: { where: { completada: true }, select: { tarea_id: true } },
          },
        });
        (user as any).persona = fullPersona;
      }
    }

    // Role switching: if user is SUPERADMIN and wants to view as MIEMBRO
    if (viewingAsRole === "MIEMBRO" && user.rol === "SUPERADMIN" && user.persona_id) {
      let miembroUser = await prisma.usuario.findFirst({
        where: {
          persona_id: user.persona_id,
          iglesia_id: user.iglesia_id,
          rol: "MIEMBRO",
        },
        select: {
          id: true,
          iglesia_id: true,
          email: true,
          password: true,
          rol: true,
          estado: true,
          persona_id: true,
          paginas_acceso: true,
          persona: {
            select: {
              id: true,
              nombre: true,
              telefono: true,
              fecha_nacimiento: true,
              sexo: true,
              foto_url: true,
              correo: true,
              etapa_id: true,
              etapa: { select: { nombre_etapa: true } },
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
            },
          },
        },
      });

      if (!miembroUser) {
        miembroUser = await prisma.usuario.create({
          data: {
            iglesia_id: user.iglesia_id,
            email: user.email,
            password: user.password,
            rol: "MIEMBRO",
            persona_id: user.persona_id,
            estado: "ACTIVO",
          },
          select: {
            id: true,
            iglesia_id: true,
            email: true,
            password: true,
            rol: true,
            estado: true,
            persona_id: true,
            paginas_acceso: true,
            persona: {
              select: {
                id: true,
                nombre: true,
                telefono: true,
                fecha_nacimiento: true,
                sexo: true,
                foto_url: true,
                correo: true,
                etapa_id: true,
                etapa: { select: { nombre_etapa: true } },
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
              },
            },
          },
        });
      }

      if (miembroUser) {
        const resp: any = mapUserToResponse(miembroUser);
        resp.viewingAs = "MIEMBRO";
        resp.canSwitchRole = true;
        return NextResponse.json(resp);
      }
    }

    // If superadmin is viewing as SUPERADMIN (or default), include switch info
    if (user.rol === "SUPERADMIN" && user.persona_id) {
      const resp: any = mapUserToResponse(user);
      resp.viewingAs = "SUPERADMIN";
      resp.canSwitchRole = true;
      return NextResponse.json(resp);
    }

    if (user.rol !== "SUPERADMIN") {
      const church = await prisma.iglesia.findUnique({ where: { id: user.iglesia_id } });
      if (church?.estado === "SUSPENDIDO") {
        cookieStore.delete("session_user_id");
        cookieStore.delete("active_iglesia_id");
        return NextResponse.json({ error: "La iglesia asociada a esta cuenta ha sido suspendida. Contacte a soporte." }, { status: 403 });
      }
      if (church && (church.estado_pago === "VENCIDO" || (church.fecha_vencimiento && new Date(church.fecha_vencimiento).getTime() < Date.now()))) {
        cookieStore.delete("session_user_id");
        cookieStore.delete("active_iglesia_id");
        return NextResponse.json({ error: "La licencia de su iglesia ha vencido o el pago mensual está pendiente. Contacte al administrador." }, { status: 403 });
      }
      if (user.estado === "SUSPENDIDO") {
        cookieStore.delete("session_user_id");
        cookieStore.delete("active_iglesia_id");
        return NextResponse.json({ error: "Su cuenta de usuario ha sido suspendida. Contacte a soporte." }, { status: 403 });
      }
    }

    return NextResponse.json(mapUserToResponse(user));
  } catch (error: any) {
    console.error("Error in GET /api/auth:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await ensureSuperAdminExists();
    const body = await request.json();
    const { action, email, password, slug, userId } = body;
    const cookieStore = await cookies();

    // 1. Manejo de Cierre de Sesión
    if (action === "logout") {
      cookieStore.delete("session_user_id");
      cookieStore.delete("active_iglesia_id");
      cookieStore.delete("viewing_as_role");
      return NextResponse.json({ success: true });
    }

    // 1c. Cambiar modo de vista (Admin <-> Miembro)
    if (action === "switch-role") {
      const { viewingAs } = body;
      if (viewingAs === "SUPERADMIN" || viewingAs === "MIEMBRO") {
        cookieStore.set("viewing_as_role", viewingAs, { path: "/", maxAge: 31536000, sameSite: "lax", httpOnly: true, secure: true });
        return NextResponse.json({ success: true, viewingAs });
      }
      // If no viewingAs, toggle current
      const currentView = cookieStore.get("viewing_as_role")?.value;
      const newView = currentView === "MIEMBRO" ? "SUPERADMIN" : "MIEMBRO";
      cookieStore.set("viewing_as_role", newView, { path: "/", maxAge: 31536000, sameSite: "lax", httpOnly: true, secure: true });
      return NextResponse.json({ success: true, viewingAs: newView });
    }

    // 1b. Seleccionar Iglesia Activa para Registro de Nuevos Miembros
    if (action === "set-active-church") {
      if (!slug) {
        return NextResponse.json({ error: "Se requiere el código o slug de la iglesia" }, { status: 400 });
      }
      const iglesia = await prisma.iglesia.findUnique({
        where: { subdominio_o_slug: slug }
      });
      if (!iglesia) {
        return NextResponse.json({ error: "No se encontró ninguna iglesia registrada con ese código." }, { status: 404 });
      }
      cookieStore.set("active_iglesia_id", iglesia.id, { path: "/", maxAge: 31536000, sameSite: "lax", httpOnly: true, secure: true });
      return NextResponse.json({ success: true, iglesiaId: iglesia.id });
    }

    // 2. Manejo de Registro/Asignación Directa de Persona (Backward Compatibility)
    if (userId) {
      let usuario = await prisma.usuario.findFirst({
        where: { persona_id: userId },
        select: {
          id: true, iglesia_id: true, email: true, password: true, rol: true,
          estado: true, persona_id: true, paginas_acceso: true,
          persona: {
            select: {
              id: true, nombre: true, telefono: true, fecha_nacimiento: true,
              sexo: true, foto_url: true, correo: true, etapa_id: true,
              etapa: { select: { nombre_etapa: true } },
              grupo_conexion: { select: { nombre_grupo: true, sociedad: { select: { nombre_sociedad: true } } } },
              historial_tareas: { where: { completada: true }, select: { tarea_id: true } },
            }
          }
        }
      });

      if (!usuario) {
        const persona = await prisma.persona.findUnique({
          where: { id: userId },
          select: { id: true, iglesia_id: true, correo: true, nombre: true }
        });

        if (persona) {
          usuario = await prisma.usuario.create({
            data: {
              iglesia_id: persona.iglesia_id,
              email: persona.correo || `${persona.nombre.toLowerCase().replace(/\s+/g, "")}@igleconexion.com`,
              password: "password123",
              rol: "MIEMBRO",
              persona_id: persona.id
            },
            select: {
              id: true, iglesia_id: true, email: true, password: true, rol: true,
              estado: true, persona_id: true, paginas_acceso: true,
              persona: {
                select: {
                  id: true, nombre: true, telefono: true, fecha_nacimiento: true,
                  sexo: true, foto_url: true, correo: true, etapa_id: true,
                  etapa: { select: { nombre_etapa: true } },
                  grupo_conexion: { select: { nombre_grupo: true, sociedad: { select: { nombre_sociedad: true } } } },
                  historial_tareas: { where: { completada: true }, select: { tarea_id: true } },
                }
              }
            }
          });
        }
      }

      if (usuario) {
        cookieStore.set("session_user_id", usuario.id, { path: "/", maxAge: 31536000, sameSite: "lax", httpOnly: true, secure: true });
        cookieStore.set("active_iglesia_id", usuario.iglesia_id, { path: "/", maxAge: 31536000, sameSite: "lax", httpOnly: true, secure: true });
        return NextResponse.json(mapUserToResponse(usuario));
      }

      return NextResponse.json({ error: "User/Persona not found" }, { status: 404 });
    }

    // 3. Manejo de Inicio de Sesión SaaS Convencional
    if (!email || !password) {
      return NextResponse.json({ error: "Faltan correo o contraseña" }, { status: 400 });
    }

    // A. Verificar si es SuperAdmin global
    if (email === "alexpalacio29@gmail.com" && password === "superpassword") {
      const superAdminUser = await prisma.usuario.findFirst({
        where: { rol: "SUPERADMIN" },
        select: {
          id: true,
          iglesia_id: true,
          email: true,
          password: true,
          rol: true,
          estado: true,
          persona_id: true,
          paginas_acceso: true,
          persona: {
            select: {
              id: true,
              nombre: true,
              telefono: true,
              fecha_nacimiento: true,
              sexo: true,
              foto_url: true,
              correo: true,
              etapa_id: true,
              etapa: { select: { nombre_etapa: true } },
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
            },
          },
        },
      });
      if (superAdminUser) {
        // Resolve which church to use: prefer the slug from the login form
        let activeChurchId = superAdminUser.iglesia_id;
        if (slug) {
          const targetChurch = await prisma.iglesia.findUnique({
            where: { subdominio_o_slug: slug },
          });
          if (targetChurch) {
            activeChurchId = targetChurch.id;
          }
        }

        cookieStore.set("session_user_id", superAdminUser.id, { path: "/", maxAge: 31536000, sameSite: "lax", httpOnly: true, secure: true });
        cookieStore.set("active_iglesia_id", activeChurchId, { path: "/", maxAge: 31536000, sameSite: "lax", httpOnly: true, secure: true });

        // Auto-link persona for superadmin if missing - search strictly in activeChurchId
        if (!superAdminUser.persona_id) {
          let foundPersona = await prisma.persona.findFirst({
            where: { iglesia_id: activeChurchId, correo: email },
          });

          if (foundPersona) {
            await prisma.usuario.update({
              where: { id: superAdminUser.id },
              data: { persona_id: foundPersona.id },
            });
            superAdminUser.persona_id = foundPersona.id;
            const fullPersona = await prisma.persona.findUnique({
              where: { id: foundPersona.id },
              select: {
                id: true, nombre: true, telefono: true, fecha_nacimiento: true,
                sexo: true, foto_url: true, correo: true, etapa_id: true,
                etapa: { select: { nombre_etapa: true } },
                grupo_conexion: { select: { nombre_grupo: true, sociedad: { select: { nombre_sociedad: true } } } },
                historial_tareas: { where: { completada: true }, select: { tarea_id: true } },
              },
            });
            (superAdminUser as any).persona = fullPersona;
          }
        }

        const resp: any = mapUserToResponse(superAdminUser);
        resp.iglesia_id = activeChurchId;
        if (superAdminUser.persona_id) {
          resp.canSwitchRole = true;
          resp.viewingAs = "SUPERADMIN";
        }
        return NextResponse.json(resp);
      }
    }

    // B. Buscar Iglesia por slug
    if (!slug) {
      return NextResponse.json({ error: "Se requiere el código o slug de la iglesia" }, { status: 400 });
    }

    const iglesia = await prisma.iglesia.findUnique({
      where: { subdominio_o_slug: slug }
    });

    if (!iglesia) {
      return NextResponse.json({ error: "Iglesia no encontrada con ese código" }, { status: 404 });
    }

    // C. Validar usuario en esa iglesia específica
    const user = await prisma.usuario.findFirst({
      where: {
        iglesia_id: iglesia.id,
        email: email,
        password: password
      },
      select: {
        id: true,
        iglesia_id: true,
        email: true,
        password: true,
        rol: true,
        estado: true,
        persona_id: true,
        paginas_acceso: true,
        persona: {
          select: {
            id: true,
            nombre: true,
            telefono: true,
            fecha_nacimiento: true,
            sexo: true,
            foto_url: true,
            correo: true,
            etapa_id: true,
            etapa: { select: { nombre_etapa: true } },
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
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: "Usuario o contraseña incorrectos" }, { status: 401 });
    }

    if (iglesia.estado === "SUSPENDIDO") {
      return NextResponse.json({ error: "La iglesia correspondiente a esta cuenta ha sido suspendida. Contacte a soporte." }, { status: 403 });
    }

    if (iglesia.estado_pago === "VENCIDO" || (iglesia.fecha_vencimiento && new Date(iglesia.fecha_vencimiento).getTime() < Date.now())) {
      return NextResponse.json({ error: "La licencia de su iglesia ha vencido o el pago mensual está pendiente. Por favor contacte al administrador del sistema." }, { status: 403 });
    }

    if (user.estado === "SUSPENDIDO") {
      return NextResponse.json({ error: "Su cuenta de usuario ha sido suspendida. Contacte a soporte." }, { status: 403 });
    }

    if (user.estado === "PENDIENTE") {
      return NextResponse.json({ error: "Su cuenta de usuario está pendiente de aprobación por el líder o administrador de su iglesia." }, { status: 403 });
    }

    // Guardar cookies de sesión y redirigir
    cookieStore.set("session_user_id", user.id, { path: "/", maxAge: 31536000, sameSite: "lax", httpOnly: true, secure: true });
    cookieStore.set("active_iglesia_id", user.iglesia_id, { path: "/", maxAge: 31536000, sameSite: "lax", httpOnly: true, secure: true });

    return NextResponse.json(mapUserToResponse(user));

  } catch (error: any) {
    console.error("Error in POST /api/auth:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function mapUserToResponse(user: any) {
  const p = user.persona;

  if (!p) {
    // Si no tiene persona asociada (ej. Superadmin o Admin de Iglesia puro)
    return {
      id: user.id,
      usuario_id: user.id,
      nombre: user.rol === "SUPERADMIN" ? "Super Administrador" : "Administrador de Iglesia",
      email: user.email,
      rol: user.rol,
      iglesia_id: user.iglesia_id,
      estado: user.estado,
      foto_url: null,
      persona_id: null,
      paginas_acceso: user.paginas_acceso || null,
      // Valores por defecto para prevenir errores en UI de perfil

      telefono: "(809) 555-0100",
      fechaNacimiento: "1985-01-01",
      calculatedAge: 41,
      sexo: "M",
      sociedadName: "Administración",
      grupoName: "Liderazgo Central",
      etapa_id: "etapa-3",
      etapa_nombre: "Administrador",
      tareas_completadas: [],
    };
  }

  // Calcular edad
  let calculatedAge = 30;
  if (p.fecha_nacimiento) {
    const today = new Date();
    const birth = new Date(p.fecha_nacimiento);
    calculatedAge = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      calculatedAge--;
    }
  }

  return {
    id: p.id,
    usuario_id: user.id,
    nombre: p.nombre,
    email: user.email,
    rol: user.rol,
    iglesia_id: user.iglesia_id,
    estado: user.estado,
    persona_id: p.id,
    paginas_acceso: user.paginas_acceso || null,
    telefono: p.telefono || "(809) 555-1234",
    fechaNacimiento: p.fecha_nacimiento ? p.fecha_nacimiento.toISOString().split("T")[0] : "1990-04-15",
    calculatedAge: calculatedAge,
    sexo: p.sexo || "M",
    sociedadName: p.grupo_conexion?.sociedad?.nombre_sociedad || "Sociedad de Jóvenes",
    grupoName: p.grupo_conexion?.nombre_grupo || "Jóvenes Universitarios",
    etapa_id: p.etapa_id,
    etapa_nombre: p.etapa?.nombre_etapa || "Sin Etapa",
    tareas_completadas: p.historial_tareas?.map((ht: any) => ht.tarea_id) || [],
    foto_url: p.foto_url,
    correo: p.correo || null,
  };
}


export async function PUT(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionUserId = cookieStore.get("session_user_id")?.value;

    if (!sessionUserId) {
      return NextResponse.json({ error: "No ha iniciado sesión" }, { status: 401 });
    }

    const user = await prisma.usuario.findUnique({
      where: { id: sessionUserId }
    });

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    const body = await request.json();
    const { nombre, telefono, fechaNacimiento, sexo, foto_url } = body;

    if (!nombre) {
      return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 });
    }

    let targetPersonaId = user.persona_id;

    if (!targetPersonaId) {
      let etapa = await prisma.etapaConfig.findFirst({
        where: { iglesia_id: user.iglesia_id }
      });
      if (!etapa) {
        etapa = await prisma.etapaConfig.create({
          data: {
            iglesia_id: user.iglesia_id,
            nombre_etapa: "Etapa Inicial",
            orden_secuencial: 1
          }
        });
      }

      const newPersona = await prisma.persona.create({
        data: {
          iglesia_id: user.iglesia_id,
          etapa_id: etapa.id,
          nombre,
          telefono: telefono || null,
          fecha_nacimiento: fechaNacimiento ? new Date(fechaNacimiento + "T12:00:00") : null,
          sexo: sexo || "M",
          foto_url: foto_url || null
        }
      });

      await prisma.usuario.update({
        where: { id: user.id },
        data: { persona_id: newPersona.id }
      });

      targetPersonaId = newPersona.id;
    } else {
      await prisma.persona.update({
        where: { id: targetPersonaId },
        data: {
          nombre,
          telefono: telefono || null,
          fecha_nacimiento: fechaNacimiento ? new Date(fechaNacimiento + "T12:00:00") : null,
          sexo: sexo || "M",
          whatsapp: telefono || null,
          foto_url: foto_url || null
        }
      });
    }

    const fullUser = await prisma.usuario.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        iglesia_id: true,
        email: true,
        password: true,
        rol: true,
        estado: true,
        persona_id: true,
        paginas_acceso: true,
        persona: {
          select: {
            id: true,
            nombre: true,
            telefono: true,
            fecha_nacimiento: true,
            sexo: true,
            foto_url: true,
            correo: true,
            etapa_id: true,
            etapa: { select: { nombre_etapa: true } },
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
          }
        }
      }
    });

    return NextResponse.json(mapUserToResponse(fullUser));
  } catch (error: any) {
    console.error("Error in PUT /api/auth:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

