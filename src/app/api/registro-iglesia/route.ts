import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPlansConfig } from "@/lib/plans";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, name, slug, slogan, adminEmail, adminPassword, phone, contactMessage } = body;

    if (!code || !name || !slug || !adminEmail || !adminPassword) {
      return NextResponse.json({ error: "Faltan datos requeridos (código de activación, nombre, slug, correo admin, contraseña admin)" }, { status: 400 });
    }

    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9]/g, "");

    // 1. Validar el código de activación
    const activationCode = await prisma.codigoActivacion.findUnique({
      where: { codigo: code },
    });

    if (!activationCode) {
      return NextResponse.json({ error: "El código de activación no es válido." }, { status: 400 });
    }

    if (activationCode.usado) {
      return NextResponse.json({ error: "Este código de activación ya ha sido utilizado por otra iglesia." }, { status: 400 });
    }

    // 2. Validar si ya existe el subdominio/slug
    const existingChurch = await prisma.iglesia.findUnique({
      where: { subdominio_o_slug: cleanSlug },
    });

    if (existingChurch) {
      return NextResponse.json({ error: "Ya existe una iglesia con ese subdominio o código de URL" }, { status: 400 });
    }

    // 3. Validar si el email de administrador ya existe
    const existingUser = await prisma.usuario.findUnique({
      where: { email: adminEmail },
    });

    if (existingUser) {
      return NextResponse.json({ error: "El correo electrónico del administrador ya está registrado" }, { status: 400 });
    }

    // Calcular límites y precio por defecto según el plan del código de activación
    const plansConfig = getPlansConfig();
    const config = plansConfig[activationCode.plan] || plansConfig.BASICO;
    const limitePersonas = config.limite_personas;
    const limiteUsuarios = config.limite_usuarios;
    const precioMensual = config.precio_mensual;

    // Licencia válida por 30 días a partir de hoy (simulación de facturación)
    const fechaVencimiento = new Date();
    fechaVencimiento.setDate(fechaVencimiento.getDate() + 30);

    // 4. Crear Iglesia con el plan asociado al código
    const newChurch = await prisma.iglesia.create({
      data: {
        nombre_iglesia: name,
        subdominio_o_slug: cleanSlug,
        slogan: slogan || "Conectando Vidas con el Propósito de Dios",
        color_principal: "#0284c7",
        plan: activationCode.plan,
        estado: "ACTIVO",
        limite_personas: limitePersonas,
        limite_usuarios: limiteUsuarios,
        precio_mensual: precioMensual,
        fecha_vencimiento: fechaVencimiento,
        estado_pago: "PAGADO",
        descripcion: `Somos la iglesia ${name}, comprometida con llevar el evangelio de Jesucristo a cada hogar de nuestra comunidad.`,
        contacto_telefono: phone || "(809) 555-0100",
        contacto_email: adminEmail,
        contacto_direccion: "Calle Principal #1, Sector Centro",
      },
    });

    // 5. Vincular y marcar código como usado
    await prisma.codigoActivacion.update({
      where: { id: activationCode.id },
      data: {
        usado: true,
        iglesia_id: newChurch.id,
      },
    });

    // 6. Inicializar configuraciones por defecto
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
    await prisma.usuario.create({
      data: {
        iglesia_id: newChurch.id,
        email: adminEmail,
        password: adminPassword,
        rol: "ADMIN_IGLESIA",
        persona_id: adminPersona.id,
      },
    });

    // H. Si se ingresó mensaje de contacto o teléfono, guardarlo en el buzón SaaS
    if (contactMessage || phone) {
      await prisma.contactoMensaje.create({
        data: {
          nombre: `${name} (Admin Registro)`,
          email: adminEmail,
          telefono: phone || "",
          mensaje: contactMessage || `Nueva iglesia registrada con éxito. Subdominio: ${cleanSlug}`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      church: {
        id: newChurch.id,
        nombre: newChurch.nombre_iglesia,
        slug: newChurch.subdominio_o_slug,
        plan: newChurch.plan,
      },
    });
  } catch (error: any) {
    console.error("Error in POST /api/registro-iglesia:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
