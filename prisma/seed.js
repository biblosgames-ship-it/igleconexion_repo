require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
const { Pool } = require("pg");
const path = require("path");

const dbUrl = process.env.DATABASE_URL || "";
const isPostgres = dbUrl.startsWith("postgresql://") || dbUrl.startsWith("postgres://");

let prisma;
if (isPostgres) {
  const pool = new Pool({ connectionString: dbUrl });
  const adapter = new PrismaPg(pool);
  prisma = new PrismaClient({ adapter });
} else {
  const dbPath = path.join(process.cwd(), "dev.db");
  const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
  prisma = new PrismaClient({ adapter });
}

async function main() {
  console.log("Iniciando la siembra (seeding) de la base de datos...");

  // Verificar si la base de datos ya contiene información
  const iglesiaCount = await prisma.iglesia.count();
  if (iglesiaCount > 0) {
    console.log("La base de datos ya contiene información. Omitiendo la siembra (seeding) para proteger los datos existentes.");
    return;
  }

  console.log("Limpiando base de datos para inicialización limpia...");
  // Limpiar base de datos para evitar duplicados en pruebas
  await prisma.historialSubtarea.deleteMany({});
  await prisma.historialTarea.deleteMany({});
  await prisma.persona.deleteMany({});
  await prisma.liderModulo.deleteMany({});
  await prisma.usuario.deleteMany({});
  await prisma.grupoConexion.deleteMany({});
  await prisma.sociedad.deleteMany({});
  await prisma.subtareaConfig.deleteMany({});
  await prisma.tareaConfig.deleteMany({});
  await prisma.moduloConfig.deleteMany({});
  await prisma.etapaConfig.deleteMany({});
  await prisma.iglesia.deleteMany({});

  console.log("Limpieza de base de datos completada.");

  // 1. Crear Iglesia
  const iglesia = await prisma.iglesia.create({
    data: {
      id: "iglesia-default",
      nombre_iglesia: "Mi Iglesia Local",
      subdominio_o_slug: "primerahiguey",
      slogan: "Conectando Vidas con el Propósito de Dios",
      logo_url: "",
      color_principal: "#0284c7",
      descripcion: "Somos una comunidad de fe comprometida con llevar el evangelio de Jesucristo a cada hogar de nuestra comunidad. Fundada hace más de 15 años, nuestra iglesia ha sido un faro de esperanza, restauración y discipulado. Nos enfocamos en conectar a las personas con su propósito divino a través de la adoración, la comunión, el servicio y la educación bíblica continua.",
      quienes_somos: "Somos una familia espiritual de creyentes dedicados a adorar a Dios, crecer en comunión y compartir la gracia de Cristo con nuestra ciudad.",
      mision: "Llevar el evangelio transformador de Jesús a cada persona de nuestra comunidad, discipulando a cada miembro para vivir con propósito y servir al prójimo.",
      vision: "Ser una iglesia relevante, vibrante y unida, que inspire fe y restauración en cada hogar, multiplicando grupos de conexión para la gloria de Dios.",
      valores: "• Amor y Gracia\n• Fidelidad Bíblica\n• Comunión Auténtica\n• Servicio Altruista\n• Excelencia para Dios",
      historia: "Fundada en el año 2011 por los pastores principales, nuestra iglesia comenzó en la sala de una casa con solo cinco familias. A lo largo de quince años de fidelidad divina, hemos visto la mano de Dios obrar innumerables milagros, expandiendo nuestras instalaciones y abriendo grupos pequeños en todos los sectores de Higuey para restaurar y discipular a miles de personas.",
      contacto_telefono: "(809) 555-0199",
      contacto_email: "contacto@miiglesialocal.org",
      contacto_direccion: "Av. Libertad #12, Higuey, República Dominicana",
      link_google_maps: "https://www.google.com/maps/search/?api=1&query=Av.+Libertad+%2312%2C+Higuey%2C+República+Dominicana",
      link_waze: "https://waze.com/ul?q=Av.+Libertad+%2312%2C+Higuey%2C+República+Dominicana&navigate=yes",
      redes_sociales: JSON.stringify({
        facebook: "https://facebook.com/miiglesialocal",
        instagram: "https://instagram.com/miiglesialocal",
        youtube: "https://youtube.com/miiglesialocal"
      }),
      recursos: JSON.stringify([
        {
          id: "rec-1",
          titulo: "Manual del Nuevo Creyente",
          descripcion: "Una guía práctica de 7 días para comenzar tu caminar de fe con Jesucristo.",
          tipo: "PDF",
          url: "https://example.com/manual-nuevo-creyente.pdf"
        },
        {
          id: "rec-2",
          titulo: "Plan de Lectura Bíblica Anual",
          descripcion: "Lee toda la Biblia en un año dedicando solo 15 minutos al día.",
          tipo: "LINK",
          url: "https://example.com/plan-lectura"
        }
      ]),
      eventos: JSON.stringify([
        {
          id: "ev-1",
          titulo: "Ayuno General de Consagración",
          fecha: "2026-07-04",
          hora: "08:00",
          descripcion: "Un tiempo de búsqueda intensa de la presencia de Dios y clamor por las familias."
        },
        {
          id: "ev-2",
          titulo: "Campaña de Oración y Milagros",
          fecha: "2026-07-15",
          hora: "19:00",
          descripcion: "Acompáñanos a clamar bajo el lema: 'Para Dios nada es imposible'."
        }
      ])
    },
  });
  console.log(`Iglesia creada: ${iglesia.nombre_iglesia} (slug: ${iglesia.subdominio_o_slug})`);

  // 2. Crear Etapas
  const etapas = [];
  const etapaData = [
    { id: "etapa-1", nombre_etapa: "Etapa 1: Visita Inicial", orden_secuencial: 1 },
    { id: "etapa-2", nombre_etapa: "Etapa 2: Nuevo Creyente", orden_secuencial: 2 },
    { id: "etapa-3", nombre_etapa: "Etapa 3: Miembro Activo", orden_secuencial: 3 },
  ];

  for (const ed of etapaData) {
    const etapa = await prisma.etapaConfig.create({
      data: {
        id: ed.id,
        iglesia_id: iglesia.id,
        nombre_etapa: ed.nombre_etapa,
        orden_secuencial: ed.orden_secuencial,
      },
    });
    etapas.push(etapa);
  }
  console.log(`Etapas creadas: ${etapas.length}`);

  // 3. Crear Módulos
  const modulos = [];
  const moduloData = [
    { id: "mod-1", nombre_modulo: "Consolidación" },
    { id: "mod-2", nombre_modulo: "Educación Cristiana" },
    { id: "mod-3", nombre_modulo: "Directiva Juvenil" },
  ];

  for (const md of moduloData) {
    const mod = await prisma.moduloConfig.create({
      data: {
        id: md.id,
        iglesia_id: iglesia.id,
        nombre_modulo: md.nombre_modulo,
      },
    });
    modulos.push(mod);
  }
  console.log(`Módulos creados: ${modulos.length}`);

  // 4. Crear Tareas / Procesos
  const tareasData = [
    { id: "proc-1", nombre_tarea: "Llamada de Primer Contacto", modulo_id: "mod-1", etapa_id: "etapa-1", dias_limite: 1, es_obligatoria: true, orden: 1 },
    { id: "proc-2", nombre_tarea: "Visita en el hogar", modulo_id: "mod-1", etapa_id: "etapa-1", dias_limite: 7, es_obligatoria: true, orden: 2 },
    { id: "proc-3", nombre_tarea: "Doctrina Pastoral", modulo_id: "mod-1", etapa_id: "etapa-2", dias_limite: null, es_obligatoria: true, orden: 3 },
    { id: "proc-4", nombre_tarea: "Asistencia a 4 Clases Bíblicas", modulo_id: "mod-2", etapa_id: "etapa-2", dias_limite: 15, es_obligatoria: true, orden: 4 },
    { id: "proc-5", nombre_tarea: "Curso de Liderazgo Básico", modulo_id: "mod-2", etapa_id: "etapa-3", dias_limite: 30, es_obligatoria: true, orden: 5 },
    { id: "proc-6", nombre_tarea: "Entrega de recursos de bienvenida", modulo_id: "mod-1", etapa_id: null, dias_limite: 7, es_obligatoria: false, orden: 6 },
    { id: "proc-7", nombre_tarea: "Integración a un grupo de familia", modulo_id: "mod-1", etapa_id: null, dias_limite: 30, es_obligatoria: false, orden: 7 },
  ];

  for (const td of tareasData) {
    await prisma.tareaConfig.create({
      data: {
        id: td.id,
        iglesia_id: iglesia.id,
        nombre_tarea: td.nombre_tarea,
        modulo_id: td.modulo_id,
        etapa_id: td.etapa_id,
        dias_limite: td.dias_limite,
        es_obligatoria: td.es_obligatoria,
        orden: td.orden,
      },
    });
  }
  console.log(`Tareas/Procesos creados: ${tareasData.length}`);

  // 5. Crear Subtareas para proc-3 (Doctrina Pastoral)
  const subtareasData = [
    { id: "sub-def-1", tarea_config_id: "proc-3", nombre_subtarea: "Llevar al creyente a la clase de doctrina", dias_limite: 3 },
    { id: "sub-def-2", tarea_config_id: "proc-3", nombre_subtarea: "Supervisar su asistencia semanal", dias_limite: 10 },
    { id: "sub-def-3", tarea_config_id: "proc-3", nombre_subtarea: "Contactarlo al finalizar para responder dudas", dias_limite: 15 },
  ];

  for (const sd of subtareasData) {
    await prisma.subtareaConfig.create({
      data: {
        id: sd.id,
        tarea_config_id: sd.tarea_config_id,
        nombre_subtarea: sd.nombre_subtarea,
        dias_limite: sd.dias_limite,
      },
    });
  }
  console.log(`Subtareas creadas: ${subtareasData.length}`);

  // 6. Crear Sociedades
  const sociedades = [];
  const sociedadData = [
    { id: "soc-1", nombre_sociedad: "Sociedad de Jóvenes", rango_edad_min: 13, rango_edad_max: 30, sexo_requerido: "MIXTO" },
    { id: "soc-2", nombre_sociedad: "Sociedad de Caballeros", rango_edad_min: 30, rango_edad_max: 99, sexo_requerido: "M" },
    { id: "soc-3", nombre_sociedad: "Sociedad de Damas", rango_edad_min: 30, rango_edad_max: 99, sexo_requerido: "F" },
  ];

  for (const sd of sociedadData) {
    const soc = await prisma.sociedad.create({
      data: {
        id: sd.id,
        iglesia_id: iglesia.id,
        nombre_sociedad: sd.nombre_sociedad,
        rango_edad_min: sd.rango_edad_min,
        rango_edad_max: sd.rango_edad_max,
        sexo_requerido: sd.sexo_requerido,
      },
    });
    sociedades.push(soc);
  }
  console.log(`Sociedades creadas: ${sociedades.length}`);

  // 7. Crear Grupos de Conexión
  const grupos = [];
  const grupoData = [
    { id: "gc-1", sociedad_id: "soc-1", nombre_grupo: "Jóvenes Universitarios", rango_edad_min: 18, rango_edad_max: 25 },
    { id: "gc-2", sociedad_id: "soc-1", nombre_grupo: "Adolescentes", rango_edad_min: 13, rango_edad_max: 17 },
    { id: "gc-3", sociedad_id: "soc-2", nombre_grupo: "Caballeros Mayores", rango_edad_min: 60, rango_edad_max: 99 },
    { id: "gc-4", sociedad_id: "soc-3", nombre_grupo: "Damas Activas", rango_edad_min: 18, rango_edad_max: 59 },
  ];

  for (const gd of grupoData) {
    const gc = await prisma.grupoConexion.create({
      data: {
        id: gd.id,
        sociedad_id: gd.sociedad_id,
        nombre_grupo: gd.nombre_grupo,
        rango_edad_min: gd.rango_edad_min,
        rango_edad_max: gd.rango_edad_max,
      },
    });
    grupos.push(gc);
  }
  console.log(`Grupos de Conexión creados: ${grupos.length}`);

  // 8. Crear Usuarios (Administradores y Líderes)
  const pastorUser = await prisma.usuario.create({
    data: {
      id: "user-pastor",
      iglesia_id: iglesia.id,
      email: "pastor@igleconexion.com",
      password: "password123", // En producción usar hashing (bcrypt), para local es suficiente texto plano
      rol: "ADMIN_IGLESIA",
    },
  });

  const liderUser = await prisma.usuario.create({
    data: {
      id: "user-lider-carlos",
      iglesia_id: iglesia.id,
      email: "carlos@igleconexion.com",
      password: "password123",
      rol: "LIDER",
    },
  });
  console.log("Usuarios creados (Pastor y Líder Carlos).");

  // Asignar Liderazgo a Módulos
  await prisma.liderModulo.create({
    data: {
      id: "lid-1",
      usuario_id: liderUser.id,
      modulo_id: "mod-1", // Consolidación
      alcance_tipo: "GRUPO_CONEXION",
      grupo_conexion_id: "gc-1", // Jóvenes Universitarios
    },
  });

  await prisma.liderModulo.create({
    data: {
      id: "lid-2",
      usuario_id: pastorUser.id,
      modulo_id: "mod-1", // Consolidación (Global para pastor)
      alcance_tipo: "GLOBAL",
    },
  });
  console.log("Asignaciones de líderes creadas.");

  // 9. Crear Personas (Miembros / Creyentes)
  const miembro1 = await prisma.persona.create({
    data: {
      id: "miembro-1",
      iglesia_id: iglesia.id,
      etapa_id: "etapa-2", // Nuevo Creyente
      nombre: "Juan Pérez",
      telefono: "(809) 555-1234",
      whatsapp: "(809) 555-1234",
      fecha_nacimiento: new Date("1990-04-15"),
      sexo: "M",
      correo: "juan.perez@gmail.com",
      estado_civil: "Soltero/a",
      tiene_hijos: false,
      nivel_academico: "Universitario",
      profesion_oficio: "Ingeniero",
      formacion_ministerial: false,
      sector: "Centro Ciudad",
      calle: "Calle Duarte",
      numero_casa: "45",
      grupo_conexion_id: "gc-1", // Jóvenes Universitarios
    },
  });

  const miembro2 = await prisma.persona.create({
    data: {
      id: "miembro-2",
      iglesia_id: iglesia.id,
      etapa_id: "etapa-3", // Miembro Activo
      nombre: "María López",
      telefono: "(829) 111-2222",
      whatsapp: "(829) 111-2222",
      fecha_nacimiento: new Date("2009-08-20"), // 17 años
      sexo: "F",
      correo: "maria.lopez@hotmail.com",
      estado_civil: "Soltero/a",
      tiene_hijos: false,
      grupo_conexion_id: "gc-2", // Adolescentes
    },
  });

  const miembro3 = await prisma.persona.create({
    data: {
      id: "miembro-3",
      iglesia_id: iglesia.id,
      etapa_id: "etapa-2", // Nuevo Creyente
      nombre: "Roberto Sánchez",
      telefono: "(809) 333-4444",
      whatsapp: "(809) 333-4444",
      fecha_nacimiento: new Date("1960-12-05"), // 65 años
      sexo: "M",
      correo: "roberto.sanchez@gmail.com",
      estado_civil: "Casado/a",
      tiene_hijos: true,
      grupo_conexion_id: "gc-3", // Caballeros Mayores
    },
  });
  console.log("Personas (miembros de prueba) creadas.");

  // Asociar Usuario con Persona para Juan Pérez (si simula inicio sesión)
  const juanUser = await prisma.usuario.create({
    data: {
      id: "user-juan",
      iglesia_id: iglesia.id,
      email: "juan.perez@gmail.com",
      password: "password123",
      rol: "MIEMBRO",
      persona_id: miembro1.id,
    },
  });

  // 10. Completar una tarea para Juan Pérez
  await prisma.historialTarea.create({
    data: {
      persona_id: miembro1.id,
      tarea_id: "proc-4", // Asistencia a 4 Clases Bíblicas
      completada: true,
      fecha_completa: new Date(),
    },
  });
  console.log("Historial de Tarea completado para Juan Pérez.");

  console.log("¡Seeding completado con éxito!");
}

main()
  .catch((e) => {
    console.error("Error al sembrar la base de datos:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
