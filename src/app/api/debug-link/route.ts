import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/active-church";

export async function GET() {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const requestingUser = await prisma.usuario.findUnique({ where: { id: userId } });
    if (!requestingUser || requestingUser.rol !== "SUPERADMIN") {
      return NextResponse.json({ error: "Acceso restringido a SuperAdministrador" }, { status: 403 });
    }

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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === "setup-leader") {
      const superAdmin = await prisma.usuario.findFirst({ where: { rol: "SUPERADMIN" } });
      if (!superAdmin) return NextResponse.json({ error: "No superadmin" });

      const torrefuerte = await prisma.iglesia.findUnique({ where: { subdominio_o_slug: "torrefuerterd" } });
      if (!torrefuerte) return NextResponse.json({ error: "No torrefuerterd" });

      const eduDept = await prisma.grupoTrabajo.findFirst({
        where: { iglesia_id: torrefuerte.id, nombre: "Educacion Cristiana" }
      });
      if (!eduDept) return NextResponse.json({ error: "No Educacion Cristiana dept" });

      const existing = await prisma.miembroGrupoTrabajo.findFirst({
        where: { usuario_id: superAdmin.id, grupo_trabajo_id: eduDept.id }
      });

      if (!existing) {
        await prisma.miembroGrupoTrabajo.create({
          data: {
            usuario_id: superAdmin.id,
            grupo_trabajo_id: eduDept.id,
            puesto: "LIDER"
          }
        });
      }

      if (superAdmin.rol === "MIEMBRO") {
        await prisma.usuario.update({ where: { id: superAdmin.id }, data: { rol: "LIDER" } });
      }

      return NextResponse.json({ success: true, message: "Superadmin added to Educacion Cristiana as LIDER" });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message });
  }
}
