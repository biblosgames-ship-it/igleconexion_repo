import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActiveChurchId, getSessionUserId } from "@/lib/active-church";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const defaultIglesiaId = await getActiveChurchId();
    const sessionUserId = await getSessionUserId();

    if (!sessionUserId) {
      return NextResponse.json({ error: "No ha iniciado sesión" }, { status: 401 });
    }

    // Await params if it's a promise (Next.js 15+ standard for dynamic params)
    const resolvedParams = await Promise.resolve(params);
    const targetPersonaId = resolvedParams.id;

    if (!targetPersonaId) {
      return NextResponse.json({ error: "ID de persona requerido" }, { status: 400 });
    }

    // Verificar que la persona pertenece a la misma iglesia o al ecosistema general de la iglesia activa
    const persona = await prisma.persona.findUnique({
      where: { id: targetPersonaId },
      include: {
        etapa: true,
        grupo_conexion: {
          include: {
            sociedad: true,
          },
        },
        usuario: true, // Para traer foto_url o datos del usuario vinculado
      },
    });

    if (!persona) {
      return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });
    }

    // Load family members using familia_codigo
    let familyLinks: any[] = [];
    if (persona.familia_codigo) {
      const familiares = await prisma.persona.findMany({
        where: {
          iglesia_id: persona.iglesia_id,
          familia_codigo: persona.familia_codigo,
          id: { not: persona.id } // Exclude current persona
        },
        select: {
          id: true,
          nombre: true,
          rol_familiar: true,
        }
      });
      familyLinks = familiares.map(f => ({
        id: f.id,
        nombre: f.nombre,
        rol: f.rol_familiar || "Familiar",
      }));
    }

    const profileData = {
      id: persona.id,
      nombre: persona.nombre,
      telefono: persona.telefono || "",
      sexo: persona.sexo || "",
      fechaNacimiento: persona.fecha_nacimiento 
        ? new Date(persona.fecha_nacimiento).toISOString().split("T")[0] 
        : "",
      foto_url: persona.foto_url || "",
      etapa_id: persona.etapa_id,
      etapa_nombre: persona.etapa?.nombre_etapa || "Ninguna",
      grupo_conexion_id: persona.grupo_conexion_id,
      grupo_conexion_nombre: persona.grupo_conexion?.nombre_grupo || "Sin grupo",
      tareas_completadas: [], // Oculto o simplificado para vista de otros
      familia: familyLinks,
    };

    return NextResponse.json(profileData);
  } catch (error: any) {
    console.error("Error in GET /api/perfil/[id]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
