import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/active-church";

// Helper function to generate unique activation codes
function generateRandomCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let part1 = "";
  let part2 = "";
  for (let i = 0; i < 4; i++) {
    part1 += chars.charAt(Math.floor(Math.random() * chars.length));
    part2 += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `IGLE-${part1}-${part2}`;
}

export async function GET() {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const userObj = await prisma.usuario.findUnique({
      where: { id: userId },
    });
    if (!userObj || userObj.rol !== "SUPERADMIN") {
      return NextResponse.json({ error: "Prohibido: Acceso restringido a SuperAdministrador" }, { status: 403 });
    }
    // 1. Fetch Churches
    const churches = await prisma.iglesia.findMany({
      include: {
        _count: {
          select: {
            personas: true,
            usuarios: true,
          },
        },
        usuarios: {
          where: { rol: "ADMIN_IGLESIA" },
          select: { id: true, email: true, rol: true, persona_id: true },
        },
      },
    });

    const mappedChurches = await Promise.all(churches.map(async (church) => {
      const adminUser = church.usuarios.find(u => u.rol === "ADMIN_IGLESIA") || church.usuarios[0];
      
      const uniqueLeaders = await prisma.liderModulo.findMany({
        where: {
          usuario: {
            iglesia_id: church.id
          }
        },
        distinct: ['usuario_id']
      });

      return {
        id: church.id,
        nombre: church.nombre_iglesia,
        slug: church.subdominio_o_slug,
        slogan: church.slogan,
        logo: church.logo_url,
        plan: church.plan,
        estado: church.estado,
        limitePersonas: church.limite_personas,
        limiteUsuarios: church.limite_usuarios,
        precioMensual: church.precio_mensual,
        fechaVencimiento: church.fecha_vencimiento,
        estadoPago: church.estado_pago,
        miembrosCount: church._count.personas,
        usuariosCount: uniqueLeaders.length,
        lideresCount: uniqueLeaders.length,
        adminEmail: adminUser ? adminUser.email : "Sin administrador",
        adminUserId: adminUser ? adminUser.id : null,
        adminPersonaId: adminUser ? adminUser.persona_id : null,
        createdAt: church.createdAt,
      };
    }));

    // 2. Fetch Users
    const users = await prisma.usuario.findMany({
      include: {
        iglesia: {
          select: { nombre_iglesia: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const mappedUsers = users.map((user) => ({
      id: user.id,
      email: user.email,
      rol: user.rol,
      estado: user.estado,
      iglesiaNombre: user.iglesia?.nombre_iglesia || "Sistema",
      iglesiaId: user.iglesia_id,
      createdAt: user.createdAt,
    }));

    // 3. Fetch Activation Codes
    const codes = await prisma.codigoActivacion.findMany({
      orderBy: { createdAt: "desc" },
    });

    const mappedCodes = [];
    for (const c of codes) {
      let iglesiaNombre = null;
      if (c.iglesia_id) {
        const igl = await prisma.iglesia.findUnique({
          where: { id: c.iglesia_id },
          select: { nombre_iglesia: true },
        });
        iglesiaNombre = igl?.nombre_iglesia || "Eliminada";
      }
      mappedCodes.push({
        id: c.id,
        codigo: c.codigo,
        plan: c.plan,
        usado: c.usado,
        iglesiaId: c.iglesia_id,
        iglesiaNombre,
        createdAt: c.createdAt,
      });
    }

    // 4. Fetch Contact Messages
    const contactMessages = await prisma.contactoMensaje.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      churches: mappedChurches,
      users: mappedUsers,
      codes: mappedCodes,
      contactMessages,
    });
  } catch (error: any) {
    console.error("Error in GET /api/superadmin:", error);
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
    });
    if (!userObj || userObj.rol !== "SUPERADMIN") {
      return NextResponse.json({ error: "Prohibido: Acceso restringido a SuperAdministrador" }, { status: 403 });
    }

    const body = await request.json();
    const { action, data } = body;

    // Si no hay acción explícita en el body, asumimos creación de iglesia heredada
    if (!action) {
      return await createChurchLegacy(body);
    }

    switch (action) {
      // A. Control de Estado de Iglesias
      case "toggleChurchStatus": {
        const { churchId, status } = data;
        if (!churchId || !status) {
          return NextResponse.json({ error: "Falta ID de iglesia o estado" }, { status: 400 });
        }
        const updated = await prisma.iglesia.update({
          where: { id: churchId },
          data: { estado: status },
        });
        return NextResponse.json({ success: true, church: updated });
      }

      // B. Cambio de Plan de Iglesias
      case "changeChurchPlan": {
        const { churchId, plan } = data;
        if (!churchId || !plan) {
          return NextResponse.json({ error: "Falta ID de iglesia o plan" }, { status: 400 });
        }
        const updated = await prisma.iglesia.update({
          where: { id: churchId },
          data: { plan: plan },
        });
        return NextResponse.json({ success: true, church: updated });
      }

      // BB. Actualización de Facturación y Límites de Iglesia
      case "updateChurchBilling": {
        const { churchId, plan, limitePersonas, limiteUsuarios, precioMensual, fechaVencimiento, estadoPago } = data;
        if (!churchId) {
          return NextResponse.json({ error: "Falta ID de la iglesia" }, { status: 400 });
        }
        const updated = await prisma.iglesia.update({
          where: { id: churchId },
          data: {
            plan,
            limite_personas: limitePersonas ? parseInt(limitePersonas) : undefined,
            limite_usuarios: limiteUsuarios ? parseInt(limiteUsuarios) : undefined,
            precio_mensual: precioMensual ? parseFloat(precioMensual) : undefined,
            fecha_vencimiento: fechaVencimiento ? new Date(fechaVencimiento) : null,
            estado_pago: estadoPago,
          },
        });
        return NextResponse.json({ success: true, church: updated });
      }

      // C. Control de Estado de Usuarios
      case "toggleUserStatus": {
        const { userId, status } = data;
        if (!userId || !status) {
          return NextResponse.json({ error: "Falta ID de usuario o estado" }, { status: 400 });
        }

        const user = await prisma.usuario.findUnique({ where: { id: userId } });
        if (user?.rol === "SUPERADMIN") {
          return NextResponse.json({ error: "No está permitido suspender al SuperAdministrador principal del sistema" }, { status: 400 });
        }

        const updated = await prisma.usuario.update({
          where: { id: userId },
          data: { estado: status },
        });
        return NextResponse.json({ success: true, user: updated });
      }

      // D. Cambio de Rol de Usuarios
      case "changeUserRole": {
        const { userId, role } = data;
        if (!userId || !role) {
          return NextResponse.json({ error: "Falta ID de usuario o rol" }, { status: 400 });
        }
        
        const user = await prisma.usuario.findUnique({ where: { id: userId } });
        if (user?.rol === "SUPERADMIN") {
          return NextResponse.json({ error: "No se puede cambiar el rol del SuperAdministrador principal" }, { status: 400 });
        }

        const updated = await prisma.usuario.update({
          where: { id: userId },
          data: { rol: role },
        });
        return NextResponse.json({ success: true, user: updated });
      }

      // E. Generación de Códigos de Activación
      case "generateCode": {
        const { plan } = data;
        const codeString = generateRandomCode();
        
        const newCode = await prisma.codigoActivacion.create({
          data: {
            codigo: codeString,
            plan: plan || "BASICO",
          },
        });
        return NextResponse.json({ success: true, code: newCode });
      }

      // F. Eliminación de Códigos de Activación no Usados
      case "deleteCode": {
        const { codeId } = data;
        if (!codeId) {
          return NextResponse.json({ error: "Falta ID de código" }, { status: 400 });
        }

        const code = await prisma.codigoActivacion.findUnique({ where: { id: codeId } });
        if (code?.usado) {
          return NextResponse.json({ error: "No se puede eliminar un código de activación que ya ha sido utilizado por una iglesia" }, { status: 400 });
        }

        await prisma.codigoActivacion.delete({
          where: { id: codeId },
        });
        return NextResponse.json({ success: true });
      }

      // G. Eliminación de Mensajes de Contacto
      case "deleteContactMessage": {
        const { messageId } = data;
        if (!messageId) {
          return NextResponse.json({ error: "Falta ID del mensaje" }, { status: 400 });
        }
        await prisma.contactoMensaje.delete({
          where: { id: messageId },
        });
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: "Acción no reconocida" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Error in POST /api/superadmin:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const churchId = searchParams.get("id");

    if (!churchId) {
      return NextResponse.json({ error: "Falta el ID de la iglesia a eliminar" }, { status: 400 });
    }

    if (churchId === "iglesia-default") {
      return NextResponse.json({ error: "No está permitido eliminar la iglesia principal del sistema" }, { status: 400 });
    }

    await prisma.iglesia.delete({
      where: { id: churchId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error in DELETE /api/superadmin:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Función heredada de creación directa desde el panel de SuperAdmin (para retrocompatibilidad)
async function createChurchLegacy(body: any) {
  const { name, slug, slogan, adminEmail, adminPassword } = body;

  if (!name || !slug || !adminEmail || !adminPassword) {
    return NextResponse.json({ error: "Faltan datos requeridos (nombre, slug, correo admin, contraseña admin)" }, { status: 400 });
  }

  const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9]/g, "");

  const existingChurch = await prisma.iglesia.findUnique({
    where: { subdominio_o_slug: cleanSlug },
  });

  if (existingChurch) {
    return NextResponse.json({ error: "Ya existe una iglesia con ese subdominio o código" }, { status: 400 });
  }

  const existingUser = await prisma.usuario.findUnique({
    where: { email: adminEmail },
  });

  if (existingUser) {
    return NextResponse.json({ error: "El correo electrónico del administrador ya está registrado" }, { status: 400 });
  }

  // Crear iglesia oficial
  const newChurch = await prisma.iglesia.create({
    data: {
      nombre_iglesia: name,
      subdominio_o_slug: cleanSlug,
      slogan: slogan || "Conectando Vidas con el Propósito de Dios",
      color_principal: "#0284c7",
      plan: "BASICO",
      estado: "ACTIVO",
      descripcion: `Somos la iglesia ${name}, comprometida con llevar el evangelio de Jesucristo a cada hogar de nuestra comunidad.`,
      contacto_telefono: "(809) 555-0100",
      contacto_email: adminEmail,
      contacto_direccion: "Calle Principal #1, Sector Centro",
    },
  });

  // A. Crear Etapas de Crecimiento
  const etapa1 = await prisma.etapaConfig.create({
    data: { iglesia_id: newChurch.id, nombre_etapa: "Etapa 1: Visita Inicial", orden_secuencial: 1 },
  });
  const etapa2 = await prisma.etapaConfig.create({
    data: { iglesia_id: newChurch.id, nombre_etapa: "Etapa 2: Nuevo Creyente", orden_secuencial: 2 },
  });
  const etapa3 = await prisma.etapaConfig.create({
    data: { iglesia_id: newChurch.id, nombre_etapa: "Etapa 3: Miembro Activo", orden_secuencial: 3 },
  });

  // B. Crear Módulos/Departamentos de Trabajo
  const mod1 = await prisma.moduloConfig.create({
    data: { iglesia_id: newChurch.id, nombre_modulo: "Consolidación" },
  });
  const mod2 = await prisma.moduloConfig.create({
    data: { iglesia_id: newChurch.id, nombre_modulo: "Educación Cristiana" },
  });
  const mod3 = await prisma.moduloConfig.create({
    data: { iglesia_id: newChurch.id, nombre_modulo: "Directiva Juvenil" },
  });

  // C. Crear Procesos/Tareas base
  await prisma.tareaConfig.create({
    data: { iglesia_id: newChurch.id, modulo_id: mod1.id, etapa_id: etapa1.id, nombre_tarea: "Llamada de Primer Contacto", dias_limite: 1, es_obligatoria: true, orden: 1 },
  });
  await prisma.tareaConfig.create({
    data: { iglesia_id: newChurch.id, modulo_id: mod1.id, etapa_id: etapa1.id, nombre_tarea: "Visita en el hogar", dias_limite: 7, es_obligatoria: true, orden: 2 },
  });
  const proc3 = await prisma.tareaConfig.create({
    data: { iglesia_id: newChurch.id, modulo_id: mod1.id, etapa_id: etapa2.id, nombre_tarea: "Doctrina Pastoral", dias_limite: null, es_obligatoria: true, orden: 3 },
  });
  await prisma.tareaConfig.create({
    data: { iglesia_id: newChurch.id, modulo_id: mod2.id, etapa_id: etapa2.id, nombre_tarea: "Asistencia a 4 Clases Bíblicas", dias_limite: 15, es_obligatoria: true, orden: 4 },
  });
  await prisma.tareaConfig.create({
    data: { iglesia_id: newChurch.id, modulo_id: mod2.id, etapa_id: etapa3.id, nombre_tarea: "Curso de Liderazgo Básico", dias_limite: 30, es_obligatoria: true, orden: 5 },
  });
  await prisma.tareaConfig.create({
    data: { iglesia_id: newChurch.id, modulo_id: mod1.id, etapa_id: null, nombre_tarea: "Entrega de recursos de bienvenida", dias_limite: 7, es_obligatoria: false, orden: 6 },
  });
  await prisma.tareaConfig.create({
    data: { iglesia_id: newChurch.id, modulo_id: mod1.id, etapa_id: null, nombre_tarea: "Integración a un grupo de familia", dias_limite: 30, es_obligatoria: false, orden: 7 },
  });

  // D. Crear Subtareas de Doctrina
  await prisma.subtareaConfig.create({
    data: { tarea_config_id: proc3.id, nombre_subtarea: "Llevar al creyente a la clase de doctrina", dias_limite: 3 },
  });
  await prisma.subtareaConfig.create({
    data: { tarea_config_id: proc3.id, nombre_subtarea: "Supervisar su asistencia semanal", dias_limite: 10 },
  });
  await prisma.subtareaConfig.create({
    data: { tarea_config_id: proc3.id, nombre_subtarea: "Contactarlo al finalizar para responder dudas", dias_limite: 15 },
  });

  // E. Crear Sociedades y Grupos de Conexión
  const soc1 = await prisma.sociedad.create({
    data: { iglesia_id: newChurch.id, nombre_sociedad: "Sociedad de Jóvenes", rango_edad_min: 13, rango_edad_max: 30, sexo_requerido: "MIXTO" },
  });
  const soc2 = await prisma.sociedad.create({
    data: { iglesia_id: newChurch.id, nombre_sociedad: "Sociedad de Caballeros", rango_edad_min: 30, rango_edad_max: 99, sexo_requerido: "M" },
  });
  const soc3 = await prisma.sociedad.create({
    data: { iglesia_id: newChurch.id, nombre_sociedad: "Sociedad de Damas", rango_edad_min: 30, rango_edad_max: 99, sexo_requerido: "F" },
  });

  await prisma.grupoConexion.create({
    data: { sociedad_id: soc1.id, nombre_grupo: "Jóvenes Universitarios", rango_edad_min: 18, rango_edad_max: 25 },
  });
  await prisma.grupoConexion.create({
    data: { sociedad_id: soc1.id, nombre_grupo: "Adolescentes", rango_edad_min: 13, rango_edad_max: 17 },
  });
  await prisma.grupoConexion.create({
    data: { sociedad_id: soc2.id, nombre_grupo: "Caballeros Mayores", rango_edad_min: 60, rango_edad_max: 99 },
  });
  await prisma.grupoConexion.create({
    data: { sociedad_id: soc3.id, nombre_grupo: "Damas Activas", rango_edad_min: 18, rango_edad_max: 59 },
  });

  // F. Crear Persona del Administrador de la Iglesia
  const adminPersona = await prisma.persona.create({
    data: {
      iglesia_id: newChurch.id,
      etapa_id: etapa3.id,
      nombre: "Pastor Administrador",
      sexo: "M",
      correo: adminEmail,
    },
  });

  // G. Crear Cuenta del Usuario Administrador
  const adminUser = await prisma.usuario.create({
    data: {
      iglesia_id: newChurch.id,
      email: adminEmail,
      password: adminPassword,
      rol: "ADMIN_IGLESIA",
      persona_id: adminPersona.id,
    },
  });

  return NextResponse.json({
    success: true,
    church: {
      id: newChurch.id,
      nombre: newChurch.nombre_iglesia,
      slug: newChurch.subdominio_o_slug,
      adminEmail: adminUser.email,
    },
  });
}
