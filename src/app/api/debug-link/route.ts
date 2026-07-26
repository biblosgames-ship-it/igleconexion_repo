import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // 1. Find superadmin user
    const superAdmin = await prisma.usuario.findFirst({
      where: { rol: "SUPERADMIN" },
      include: { persona: true },
    });

    if (!superAdmin) {
      return NextResponse.json({ error: "No superadmin found" });
    }

    // 2. Find ALL personas with "alexander" or "palacio" across ALL churches
    const alexPersonas = await prisma.persona.findMany({
      where: {
        OR: [
          { nombre: { contains: "alexander", mode: "insensitive" } },
          { nombre: { contains: "palacio", mode: "insensitive" } },
          { correo: { contains: "alexpalacio", mode: "insensitive" } },
          { correo: "alexpalacio29@gmail.com" },
        ],
      },
      include: { iglesia: true },
    });

    // 3. Find torrefuerterd church
    const torrefuerte = await prisma.iglesia.findUnique({
      where: { subdominio_o_slug: "torrefuerterd" },
    });

    // 4. All personas in torrefuerterd if exists
    let tfPersonas: any[] = [];
    if (torrefuerte) {
      tfPersonas = await prisma.persona.findMany({
        where: { iglesia_id: torrefuerte.id },
        select: {
          id: true,
          nombre: true,
          correo: true,
          telefono: true,
          sexo: true,
        },
      });
    }

    // 5. All usuarios in torrefuerterd
    let tfUsuarios: any[] = [];
    if (torrefuerte) {
      tfUsuarios = await prisma.usuario.findMany({
        where: { iglesia_id: torrefuerte.id },
        select: {
          id: true,
          email: true,
          rol: true,
          persona_id: true,
        },
      });
    }

    // 6. Department memberships for superadmin
    let saDepartmentMemberships: any[] = [];
    if (torrefuerte) {
      saDepartmentMemberships = await prisma.miembroGrupoTrabajo.findMany({
        where: { usuario_id: superAdmin.id },
        include: {
          grupo_trabajo: { select: { id: true, nombre: true, tipo: true } }
        }
      });
    }

    // 7. ALL department memberships in Torre Fuerte
    let allTfDepartmentMemberships: any[] = [];
    if (torrefuerte) {
      allTfDepartmentMemberships = await prisma.miembroGrupoTrabajo.findMany({
        where: {
          grupo_trabajo: { iglesia_id: torrefuerte.id }
        },
        include: {
          usuario: { select: { id: true, email: true, rol: true } },
          grupo_trabajo: { select: { id: true, nombre: true, tipo: true } }
        }
      });
    }

    // 8. ALL grupos de trabajo in Torre Fuerte
    let tfGruposTrabajo: any[] = [];
    if (torrefuerte) {
      tfGruposTrabajo = await prisma.grupoTrabajo.findMany({
        where: { iglesia_id: torrefuerte.id },
        select: { id: true, nombre: true, tipo: true }
      });
    }

    return NextResponse.json({
      superadmin: {
        id: superAdmin.id,
        email: superAdmin.email,
        iglesia_id: superAdmin.iglesia_id,
        persona_id: superAdmin.persona_id,
      },
      alexPersonasFound: alexPersonas.map(p => ({
        id: p.id,
        nombre: p.nombre,
        correo: p.correo,
        iglesia_id: p.iglesia_id,
        iglesiaNombre: p.iglesia?.nombre_iglesia,
      })),
      torrefuerte: torrefuerte ? {
        id: torrefuerte.id,
        nombre: torrefuerte.nombre_iglesia,
        slug: torrefuerte.subdominio_o_slug,
      } : null,
      tfPersonas,
      tfUsuarios,
      saDepartmentMemberships,
      allTfDepartmentMemberships,
      tfGruposTrabajo,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message });
  }
}
