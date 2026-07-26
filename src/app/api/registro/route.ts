import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { linkFamily } from "@/lib/family";
import { getActiveChurchId } from "@/lib/active-church";
import { PLANS } from "@/lib/plans";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      nombre,
      telefono,
      whatsapp,
      fechaNacimiento,
      sexo,
      correo,
      estadoCivil,
      tieneHijos,
      nivelAcademico,
      profesion,
      formacionMinisterial,
      sector,
      calleNumero,
      medioRelacion,
      sociedadName,
      grupoName,
      etapaId,
      fechaConversion,
      esOyente,
      familiarId,
      rolFamiliar,
      foto_url,
    } = body;

    const defaultIglesiaId = await getActiveChurchId();

    // 1. Encontrar Etapa de Crecimiento
    let selectedEtapaId = etapaId;
    if (!selectedEtapaId) {
      let etapa = await prisma.etapaConfig.findFirst({
        where: { iglesia_id: defaultIglesiaId },
        orderBy: { orden_secuencial: 'asc' },
      });

      if (!etapa) {
        etapa = await prisma.etapaConfig.create({
          data: {
            iglesia_id: defaultIglesiaId,
            nombre_etapa: "Etapa 1: Amigos / Oyentes",
            orden_secuencial: 1,
          },
        });
      }
      selectedEtapaId = etapa.id;
    }

    // 2. Encontrar Grupo de Conexión en base al nombre enviado por la asignación automática del frontend
    let grupo = null;
    if (grupoName && grupoName !== "Grupo por Asignar" && grupoName !== "Grupo General") {
      grupo = await prisma.grupoConexion.findFirst({
        where: {
          nombre_grupo: grupoName,
          sociedad: {
            nombre_sociedad: sociedadName,
            iglesia_id: defaultIglesiaId,
          },
        },
      });
    }

    // Validar límite de miembros según Plan SaaS
    const iglesia = await prisma.iglesia.findUnique({
      where: { id: defaultIglesiaId },
    });

    if (iglesia) {
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
          error: `Límite de miembros alcanzado. Tu iglesia tiene un límite de ${iglesia.limite_personas} miembros oficiales (Plan ${iglesia.plan}). Por favor, actualiza tu plan o límites en la Consola SaaS.`
        }, { status: 403 });
      }
    }

    // 3. Buscar si ya existe una Persona registrada con el mismo correo o teléfono
    let newPersona = null;
    let existingPersona = null;

    if (correo) {
      existingPersona = await prisma.persona.findFirst({
        where: {
          correo: correo,
          iglesia_id: defaultIglesiaId,
        },
      });
    }

    if (!existingPersona && telefono) {
      existingPersona = await prisma.persona.findFirst({
        where: {
          telefono: telefono,
          iglesia_id: defaultIglesiaId,
        },
      });
    }

    const parseSafeDate = (d: any) => {
      if (!d || typeof d !== 'string' || !d.trim()) return null;
      const parsed = new Date(d);
      return isNaN(parsed.getTime()) ? null : parsed;
    };

    // Asignar Grupo de Conexión Automáticamente según Edad y Sexo si no viene especificado
    let autoGrupoId = grupo ? grupo.id : null;
    const parsedNacimiento = parseSafeDate(fechaNacimiento);

    if (!autoGrupoId && parsedNacimiento) {
      const today = new Date();
      let calculatedAge = today.getFullYear() - parsedNacimiento.getFullYear();
      const mDiff = today.getMonth() - parsedNacimiento.getMonth();
      if (mDiff < 0 || (mDiff === 0 && today.getDate() < parsedNacimiento.getDate())) {
        calculatedAge--;
      }

      const churchGroups = await prisma.grupoConexion.findMany({
        where: { sociedad: { iglesia_id: defaultIglesiaId } },
      });

      const matchedGc = churchGroups.find((g) => {
        const minAge = g.rango_edad_min ?? 0;
        const maxAge = g.rango_edad_max ?? 99;
        const ageMatch = calculatedAge >= minAge && calculatedAge <= maxAge;

        const gSex = (g.sexo || "").toUpperCase();
        const pSex = (sexo || "").toUpperCase();
        const sexMatch = !gSex || gSex === "MIXTO" || gSex === "MIX" || gSex === pSex;

        const isSoltero = ["SOLTERO/A", "SOLTERO", "DIVORCIADO/A", "VIUDO/A"].includes((estadoCivil || "").toUpperCase());
        const isCasado = ["CASADO/A", "CASADO", "UNIÓN LIBRE"].includes((estadoCivil || "").toUpperCase());

        if (g.estado_civil_requerido === "SOLTERO" && !isSoltero) return false;
        if (g.estado_civil_requerido === "CASADO" && !isCasado) return false;

        return ageMatch && sexMatch;
      });

      if (matchedGc) {
        autoGrupoId = matchedGc.id;
      }
    }

    if (existingPersona) {
      // Si la persona ya existe, actualizamos sus datos con la información del formulario
      newPersona = await prisma.persona.update({
        where: { id: existingPersona.id },
        data: {
          nombre: nombre || existingPersona.nombre,
          telefono: telefono || existingPersona.telefono,
          whatsapp: whatsapp || telefono || existingPersona.whatsapp,
          fecha_nacimiento: parsedNacimiento || existingPersona.fecha_nacimiento,
          sexo: sexo || existingPersona.sexo,
          estado_civil: estadoCivil || existingPersona.estado_civil,
          tiene_hijos: tieneHijos === "si" ? true : existingPersona.tiene_hijos,
          nivel_academico: nivelAcademico || existingPersona.nivel_academico,
          profesion_oficio: profesion || existingPersona.profesion_oficio,
          formacion_ministerial: formacionMinisterial === "si" ? true : existingPersona.formacion_ministerial,
          sector: sector || existingPersona.sector,
          calle: calleNumero || existingPersona.calle,
          medio_relacion: medioRelacion || existingPersona.medio_relacion,
          grupo_conexion_id: autoGrupoId || existingPersona.grupo_conexion_id,
          etapa_id: selectedEtapaId,
          es_oyente: esOyente === true,
          fecha_conversion: esOyente ? null : (parseSafeDate(fechaConversion) || existingPersona.fecha_conversion),
        },
      });
    } else {
      // Si no existe, creamos un nuevo registro de Persona
      newPersona = await prisma.persona.create({
        data: {
          iglesia_id: defaultIglesiaId,
          etapa_id: selectedEtapaId,
          grupo_conexion_id: autoGrupoId,
          nombre,
          telefono: telefono || null,
          whatsapp: whatsapp || telefono || null,
          fecha_nacimiento: parseSafeDate(fechaNacimiento),
          sexo: sexo || null,
          correo: correo || null,
          estado_civil: estadoCivil || null,
          tiene_hijos: tieneHijos === "si",
          nivel_academico: nivelAcademico || null,
          profesion_oficio: profesion || null,
          formacion_ministerial: formacionMinisterial === "si",
          sector: sector || null,
          calle: calleNumero || null,
          medio_relacion: medioRelacion || null,
          es_oyente: esOyente === true,
          fecha_conversion: esOyente ? null : parseSafeDate(fechaConversion),
          foto_url: foto_url || null,
        },
      });
    }

    // 4. Crear o vincular el Usuario miembro correspondiente
    if (correo) {
      const existingUser = await prisma.usuario.findUnique({
        where: { email: correo },
      });

      if (!existingUser) {
        await prisma.usuario.create({
          data: {
            iglesia_id: defaultIglesiaId,
            email: correo,
            password: "password123", // Contraseña genérica
            rol: "MIEMBRO",
            estado: "PENDIENTE",
            persona_id: newPersona.id,
          },
        });
      } else {
        await prisma.usuario.update({
          where: { email: correo },
          data: {
            persona_id: newPersona.id,
          },
        });
      }
    }

    // 5. Vincular a familia si se envió un familiar
    if (familiarId && rolFamiliar && newPersona.id) {
      try {
        await linkFamily(defaultIglesiaId, newPersona.id, familiarId, rolFamiliar);
      } catch (familyErr) {
        console.error("Error al vincular familia:", familyErr);
        // No fallamos el registro, solo omitimos o reportamos
      }
    }

    return NextResponse.json({
      success: true,
      miembro: {
        id: newPersona.id,
        nombre: newPersona.nombre,
        correo: newPersona.correo,
        sexo: newPersona.sexo,
      },
    });
  } catch (error: any) {
    console.error("Error in POST /api/registro:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
