import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActiveChurchId, getSessionUserId } from "@/lib/active-church";

export async function GET() {
  try {
    const defaultIglesiaId = await getActiveChurchId();
    const userId = await getSessionUserId();

    // Todas las queries base en paralelo (sin dependencias entre sí)
    const [userObj, iglesia, sociedadesRaw, gruposFamiliaRaw, etapas, modulos] = await Promise.all([
      userId ? prisma.usuario.findUnique({ where: { id: userId }, select: { rol: true } }) : null,
      prisma.iglesia.findUnique({ where: { id: defaultIglesiaId } }),
      prisma.sociedad.findMany({
        where: { iglesia_id: defaultIglesiaId },
        orderBy: { orden: "asc" },
        include: {
          grupos_conexion: true,
          agenda: { orderBy: { fecha: "asc" } },
          lideres_modulo: {
            where: { alcance_tipo: "SOCIEDAD" },
            include: { usuario: { include: { persona: true } } }
          }
        },
      }),
      prisma.grupoFamilia.findMany({
        where: { iglesia_id: defaultIglesiaId },
        orderBy: { numero_grupo: "asc" },
        include: {
          personas: true,
          lideres_modulo: {
            where: { alcance_tipo: "GRUPO_FAMILIA" },
            include: { usuario: { include: { persona: true } } }
          },
          acuerdos: { orderBy: { fecha_publicacion: "desc" } },
          necesidades: { orderBy: { createdAt: "desc" } },
        }
      }),
      prisma.etapaConfig.findMany({
        where: { iglesia_id: defaultIglesiaId },
        orderBy: { orden_secuencial: "asc" },
      }),
      prisma.moduloConfig.findMany({
        where: { iglesia_id: defaultIglesiaId },
        orderBy: { orden: "asc" },
      }),
    ]);

    if (!iglesia) {
      return NextResponse.json({ error: "Iglesia no encontrada" }, { status: 404 });
    }

    // Parse JSON columns or default to empty values
    const redes_sociales = iglesia.redes_sociales ? JSON.parse(iglesia.redes_sociales) : { facebook: "", instagram: "", youtube: "" };
    const recursos = iglesia.recursos ? JSON.parse(iglesia.recursos) : [];
    const eventos = iglesia.eventos ? JSON.parse(iglesia.eventos) : [];
    const imagenes_slider = iglesia.imagenes_slider ? JSON.parse(iglesia.imagenes_slider) : [];
    const tema_anual = iglesia.tema_anual ? JSON.parse(iglesia.tema_anual) : null;
    
    const defaultOpcionesRegistro = {
      medio_relacion: [
        "Evangelismo en la calle",
        "Invitado por un amigo/familiar",
        "Redes Sociales (Facebook / Instagram)",
        "Campaña Evangelística",
        "Visité el templo por mi cuenta"
      ]
    };
    const opciones_registro = iglesia.opciones_registro ? JSON.parse(iglesia.opciones_registro) : defaultOpcionesRegistro;

    let sociedades = sociedadesRaw.map(soc => {
      const directivaMapeada = soc.lideres_modulo.map(d => {
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
        iglesia_id: soc.iglesia_id,
        nombre_sociedad: soc.nombre_sociedad,
        rango_edad_min: soc.rango_edad_min,
        rango_edad_max: soc.rango_edad_max,
        sexo_requerido: soc.sexo_requerido,
        logo_url: soc.logo_url,
        orden: soc.orden,
        descripcion: soc.descripcion,
        horarios: soc.horarios,
        galeria: soc.galeria,
        grupos_conexion: soc.grupos_conexion,
        agenda: soc.agenda.map(item => ({
          ...item,
          fecha: item.fecha.toISOString().split("T")[0]
        })),
        directiva: directivaMapeada
      };
    });

    // Filter societies and connection groups if leader
    if (userObj && userObj.rol === "LIDER" && userId) {
      const liderRegistros = await prisma.liderModulo.findMany({
        where: { usuario_id: userId },
      });

      const isGlobal = liderRegistros.some(lr => lr.alcance_tipo === "GLOBAL");
      if (!isGlobal) {
        const allowedSocietyIds = new Set<string>();
        const allowedGroupIds = new Set<string>();

        for (const lr of liderRegistros) {
          if (lr.alcance_tipo === "SOCIEDAD" && lr.sociedad_id) {
            allowedSocietyIds.add(lr.sociedad_id);
          } else if (lr.alcance_tipo === "GRUPO_CONEXION" && lr.grupo_conexion_id) {
            allowedGroupIds.add(lr.grupo_conexion_id);
          }
        }

        sociedades = sociedades.filter(soc => {
          const isSocAllowed = allowedSocietyIds.has(soc.id);
          const hasAllowedGroup = soc.grupos_conexion.some(gc => allowedGroupIds.has(gc.id));
          return isSocAllowed || hasAllowedGroup;
        });

        sociedades = sociedades.map(soc => {
          const isSocAllowed = allowedSocietyIds.has(soc.id);
          if (isSocAllowed) {
            return soc;
          } else {
            return {
              ...soc,
              grupos_conexion: soc.grupos_conexion.filter(gc => allowedGroupIds.has(gc.id)),
            };
          }
        });
      }
    }

    const flatGrupos = sociedades.flatMap(s => s.grupos_conexion?.map(gc => ({
      id: gc.id,
      sociedad_id: s.id,
      nombre_grupo: gc.nombre_grupo,
      rango_edad_min: gc.rango_edad_min,
      rango_edad_max: gc.rango_edad_max,
      estado_civil_requerido: gc.estado_civil_requerido,
      sexo: gc.sexo
    })) || []);

    const grupos_familia = gruposFamiliaRaw.map(gf => ({
      id: gf.id,
      numero_grupo: gf.numero_grupo,
      nombre_grupo: gf.nombre_grupo,
      direccion_reunion: gf.direccion_reunion,
      dia_hora_reunion: gf.dia_hora_reunion,
      logo_url: gf.logo_url,
      descripcion: gf.descripcion,
      integrantes_count: gf.personas.length,
      directiva: gf.lideres_modulo.map(d => ({
        id: d.id,
        nombre: d.usuario.persona?.nombre || d.usuario.email.split("@")[0],
        email: d.usuario.email,
        telefono: d.usuario.persona?.telefono || "Sin teléfono"
      })),
      acuerdos: gf.acuerdos,
      necesidades: gf.necesidades
    }));

    return NextResponse.json({
      ...iglesia,
      redes_sociales,
      recursos,
      eventos,
      imagenes_slider,
      tema_anual,
      opciones_registro,
      sociedades,
      grupos: flatGrupos,
      grupos_familia,
      etapas,
      modulos,
    }, {
      headers: {
        'Cache-Control': 'private, s-maxage=30, stale-while-revalidate=120'
      }
    });
  } catch (error: any) {
    console.error("Error in GET /api/iglesia:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const defaultIglesiaId = await getActiveChurchId();

    const {
      nombre_iglesia,
      subdominio_o_slug,
      slogan,
      logo_url,
      color_principal,
      descripcion,
      quienes_somos,
      mision,
      vision,
      valores,
      historia,
      contacto_telefono,
      contacto_email,
      contacto_direccion,
      link_google_maps,
      link_waze,
      redes_sociales,
      recursos,
      eventos,
      imagenes_slider,
      tema_anual,
      opciones_registro,
      usar_grupos_familia,
    } = body;

    let cleanSlug = undefined;
    if (subdominio_o_slug) {
      cleanSlug = subdominio_o_slug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
      const existingSlug = await prisma.iglesia.findFirst({
        where: {
          subdominio_o_slug: cleanSlug,
          NOT: { id: defaultIglesiaId }
        }
      });
      if (existingSlug) {
        return NextResponse.json({ error: `El código de iglesia '${cleanSlug}' ya está en uso por otra congregación.` }, { status: 400 });
      }
    }

    const updatedIglesia = await prisma.iglesia.update({
      where: { id: defaultIglesiaId },
      data: {
        nombre_iglesia,
        ...(cleanSlug ? { subdominio_o_slug: cleanSlug } : {}),
        slogan,
        logo_url,
        color_principal: color_principal || "#0284c7",
        descripcion,
        quienes_somos,
        mision,
        vision,
        valores,
        historia,
        contacto_telefono,
        contacto_email,
        contacto_direccion,
        link_google_maps,
        link_waze,
        usar_grupos_familia: usar_grupos_familia !== undefined ? Boolean(usar_grupos_familia) : true,
        redes_sociales: redes_sociales ? JSON.stringify(redes_sociales) : null,
        recursos: recursos ? JSON.stringify(recursos) : null,
        eventos: eventos ? JSON.stringify(eventos) : null,
        imagenes_slider: imagenes_slider ? JSON.stringify(imagenes_slider) : null,
        tema_anual: tema_anual ? JSON.stringify(tema_anual) : null,
        opciones_registro: opciones_registro ? JSON.stringify(opciones_registro) : null,
      },
    });

    return NextResponse.json({
      ...updatedIglesia,
      redes_sociales: updatedIglesia.redes_sociales ? JSON.parse(updatedIglesia.redes_sociales) : { facebook: "", instagram: "", youtube: "" },
      recursos: updatedIglesia.recursos ? JSON.parse(updatedIglesia.recursos) : [],
      eventos: updatedIglesia.eventos ? JSON.parse(updatedIglesia.eventos) : [],
      imagenes_slider: updatedIglesia.imagenes_slider ? JSON.parse(updatedIglesia.imagenes_slider) : [],
      tema_anual: updatedIglesia.tema_anual ? JSON.parse(updatedIglesia.tema_anual) : null,
      opciones_registro: updatedIglesia.opciones_registro ? JSON.parse(updatedIglesia.opciones_registro) : {
        medio_relacion: [
          "Evangelismo en la calle",
          "Invitado por un amigo/familiar",
          "Redes Sociales (Facebook / Instagram)",
          "Campaña Evangelística",
          "Visité el templo por mi cuenta"
        ]
      },
    });
  } catch (error: any) {
    console.error("Error in POST /api/iglesia:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
