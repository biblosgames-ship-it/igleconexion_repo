import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { getActiveChurchId, getSessionUserId, setSessionCookie, clearSessionCookie } from "@/lib/active-church";
import bcrypt from "bcryptjs";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

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
    const hashedPassword = await bcrypt.hash("superpassword", 10);
    superAdmin = await prisma.usuario.create({
      data: {
        iglesia_id: defaultChurch.id,
        email: "alexpalacio29@gmail.com",
        password: hashedPassword,
        rol: "SUPERADMIN"
      }
    });
  }
  return superAdmin;
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionUserId = await getSessionUserId();
    const activeChurchId = await getActiveChurchId();
    const viewingAsRole = cookieStore.get("viewing_as_role")?.value;

    if (!sessionUserId) {
      return NextResponse.json({ error: "No ha iniciado sesión" }, { status: 401 });
    }

    let user = await prisma.usuario.findUnique({
      where: { id: sessionUserId },
      include: {
        persona: {
          include: {
            etapa: true,
            grupo_conexion: { include: { sociedad: true } },
            historial_tareas: { where: { completada: true } },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Auto-link u obtener la persona real del usuario en la iglesia activa seleccionada
    const searchChurchId = activeChurchId || user.iglesia_id;
    if (user.rol === "SUPERADMIN" || user.rol === "ADMIN_IGLESIA") {
      let foundPersona = await prisma.persona.findFirst({
        where: {
          correo: user.email,
          ...(searchChurchId ? { iglesia_id: searchChurchId } : {})
        },
        include: {
          etapa: true,
          grupo_conexion: { include: { sociedad: true } },
          historial_tareas: { where: { completada: true } },
        },
      });

      if (!foundPersona && user.persona_id) {
        foundPersona = await prisma.persona.findUnique({
          where: { id: user.persona_id },
          include: {
            etapa: true,
            grupo_conexion: { include: { sociedad: true } },
            historial_tareas: { where: { completada: true } },
          },
        });
      }

      if (foundPersona) {
        (user as any).persona = foundPersona;
        (user as any).persona_id = foundPersona.id;
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
      const resp: any = mapUserToResponse(user, activeChurchId);
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

    return NextResponse.json(mapUserToResponse(user, activeChurchId));
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
    const clientIp = getClientIp(request);

    // Rate limiting para inicio de sesión y restablecimiento de contraseña
    if (!action) {
      const rl = rateLimit({ key: `login:${clientIp}`, limit: 10, windowMs: 15 * 60 * 1000 });
      if (!rl.success) {
        return NextResponse.json({ error: "Demasiados intentos de inicio de sesión. Por seguridad, por favor intenta de nuevo en 15 minutos." }, { status: 429 });
      }
    } else if (action === "request-reset-code" || action === "verify-and-reset") {
      const rl = rateLimit({ key: `reset:${clientIp}`, limit: 5, windowMs: 15 * 60 * 1000 });
      if (!rl.success) {
        return NextResponse.json({ error: "Demasiadas solicitudes de restablecimiento de contraseña. Por favor intenta de nuevo en 15 minutos." }, { status: 429 });
      }
    }

    // 1. Manejo de Cierre de Sesión
    if (action === "logout") {
      await clearSessionCookie();
      return NextResponse.json({ success: true });
    }

    // 1d. Cambio de Contraseña de Usuario Autenticado (Desde Mi Perfil)
    if (action === "update-my-password") {
      const sessionUserId = await getSessionUserId();
      const { newPassword } = body;
      
      if (!sessionUserId) {
        return NextResponse.json({ error: "Debes haber iniciado sesión para cambiar tu contraseña." }, { status: 401 });
      }
      if (!newPassword || newPassword.length < 6) {
        return NextResponse.json({ error: "La nueva contraseña debe tener al menos 6 caracteres." }, { status: 400 });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await prisma.usuario.update({
        where: { id: sessionUserId },
        data: { password: hashedPassword }
      });

      return NextResponse.json({ success: true, message: "¡Tu contraseña ha sido establecida y guardada con éxito en tu perfil!" });
    }

    // 1e. Restablecimiento Seguro de Contraseña Olvidada (Paso 1: Solicitar Código de Verificación)
    if (action === "request-reset-code") {
      const { emailOrPhone, slug } = body;
      if (!emailOrPhone) {
        return NextResponse.json({ error: "Por favor ingresa tu correo electrónico o teléfono registrado." }, { status: 400 });
      }

      let churchId = null;
      if (slug) {
        const iglesia = await prisma.iglesia.findUnique({
          where: { subdominio_o_slug: slug }
        });
        if (iglesia) churchId = iglesia.id;
      }

      const user = await prisma.usuario.findFirst({
        where: {
          email: emailOrPhone,
          ...(churchId ? { iglesia_id: churchId } : {})
        }
      });

      if (!user) {
        return NextResponse.json({ error: "No encontramos ninguna cuenta registrada con este correo." }, { status: 404 });
      }

      const pinCode = Math.floor(100000 + Math.random() * 900000).toString();
      cookieStore.set("reset_challenge_pin", pinCode, { path: "/", maxAge: 900, httpOnly: true });
      cookieStore.set("reset_target_user_id", user.id, { path: "/", maxAge: 900, httpOnly: true });

      return NextResponse.json({
        success: true,
        message: `Código de verificación generado: ${pinCode}`,
        demoCode: pinCode
      });
    }

    // 1f. Restablecimiento Seguro (Paso 2: Validar Código de Verificación y Asignar Nueva Contraseña)
    if (action === "verify-and-reset") {
      const { verificationCode, newPassword } = body;
      const storedPin = cookieStore.get("reset_challenge_pin")?.value;
      const targetUserId = cookieStore.get("reset_target_user_id")?.value;

      if (!newPassword || newPassword.length < 6) {
        return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres." }, { status: 400 });
      }

      if (!storedPin || !targetUserId || verificationCode !== storedPin) {
        return NextResponse.json({ error: "El código de verificación es incorrecto o ha expirado. Intenta de nuevo." }, { status: 400 });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await prisma.usuario.update({
        where: { id: targetUserId },
        data: { password: hashedPassword }
      });

      cookieStore.delete("reset_challenge_pin");
      cookieStore.delete("reset_target_user_id");

      return NextResponse.json({ success: true, message: "¡Identidad verificada! Tu contraseña ha sido actualizada con éxito." });
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

    // 1b. Seleccionar Iglesia Activa para Registro de Nuevos Miembros o Gestión de SuperAdmin
    if (action === "set-active-church") {
      const { churchId } = body;
      let targetChurchId = churchId;
      if (!targetChurchId && slug) {
        const iglesia = await prisma.iglesia.findUnique({
          where: { subdominio_o_slug: slug }
        });
        if (iglesia) targetChurchId = iglesia.id;
      }
      if (!targetChurchId) {
        return NextResponse.json({ error: "Se requiere el código, slug o ID de la iglesia" }, { status: 400 });
      }
      cookieStore.set("active_iglesia_id", targetChurchId, { path: "/", maxAge: 31536000, sameSite: "lax", httpOnly: true, secure: true });
      return NextResponse.json({ success: true, iglesiaId: targetChurchId });
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

    // 2. Intentar autenticación como SUPERADMIN
    const superAdminCandidate = await prisma.usuario.findFirst({
      where: { rol: "SUPERADMIN", email: email },
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

    if (superAdminCandidate) {
      let isSuperAdminPassValid = false;
      if (superAdminCandidate.password.startsWith("$2a$") || superAdminCandidate.password.startsWith("$2b$")) {
        isSuperAdminPassValid = await bcrypt.compare(password, superAdminCandidate.password);
      } else if (superAdminCandidate.password === password) {
        isSuperAdminPassValid = true;
        const hashed = await bcrypt.hash(password, 10);
        await prisma.usuario.update({ where: { id: superAdminCandidate.id }, data: { password: hashed } });
      }

      if (isSuperAdminPassValid) {
        let activeChurchId = superAdminCandidate.iglesia_id;
        if (slug) {
          const targetChurch = await prisma.iglesia.findUnique({
            where: { subdominio_o_slug: slug },
          });
          if (targetChurch) {
            activeChurchId = targetChurch.id;
          }
        }

        await setSessionCookie(superAdminCandidate.id);
        cookieStore.set("active_iglesia_id", activeChurchId, { path: "/", maxAge: 31536000, sameSite: "lax", httpOnly: true, secure: process.env.NODE_ENV === "production" });

        if (!superAdminCandidate.persona_id) {
          let foundPersona = await prisma.persona.findFirst({
            where: { iglesia_id: activeChurchId, correo: email },
          });

          if (foundPersona) {
            await prisma.usuario.update({
              where: { id: superAdminCandidate.id },
              data: { persona_id: foundPersona.id },
            });
            superAdminCandidate.persona_id = foundPersona.id;
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
            (superAdminCandidate as any).persona = fullPersona;
          }
        }

        const resp: any = mapUserToResponse(superAdminCandidate);
        resp.iglesia_id = activeChurchId;
        if (superAdminCandidate.persona_id) {
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

    let isPasswordValid = false;
    if (user.password.startsWith("$2a$") || user.password.startsWith("$2b$")) {
      isPasswordValid = await bcrypt.compare(password, user.password);
    } else if (user.password === password) {
      isPasswordValid = true;
      const hashedPassword = await bcrypt.hash(password, 10);
      await prisma.usuario.update({
        where: { id: user.id },
        data: { password: hashedPassword }
      });
    }

    if (!isPasswordValid) {
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
    await setSessionCookie(user.id);
    cookieStore.set("active_iglesia_id", user.iglesia_id, { path: "/", maxAge: 31536000, sameSite: "lax", httpOnly: true, secure: process.env.NODE_ENV === "production" });

    return NextResponse.json(mapUserToResponse(user));

  } catch (error: any) {
    console.error("Error in POST /api/auth:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function mapUserToResponse(user: any, activeChurchId?: string) {
  const p = user.persona;
  const effectiveIglesiaId = (user.rol === "SUPERADMIN" && activeChurchId) ? activeChurchId : user.iglesia_id;

  if (!p) {
    // Si no tiene persona asociada (ej. Superadmin o Admin de Iglesia puro)
    return {
      id: user.id,
      usuario_id: user.id,
      nombre: user.rol === "SUPERADMIN" ? "Super Administrador" : "Administrador de Iglesia",
      email: user.email,
      rol: user.rol,
      iglesia_id: effectiveIglesiaId,
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
    iglesia_id: effectiveIglesiaId,
    estado: user.estado,
    persona_id: p.id,
    persona: p,
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

