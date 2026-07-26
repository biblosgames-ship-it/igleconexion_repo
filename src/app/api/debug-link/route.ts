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

    // 2. Find all personas in the same church
    const personas = await prisma.persona.findMany({
      where: { iglesia_id: superAdmin.iglesia_id },
      select: {
        id: true,
        nombre: true,
        correo: true,
        telefono: true,
        sexo: true,
        fecha_nacimiento: true,
      },
    });

    // 3. Find ALL usuarios in the church
    const usuarios = await prisma.usuario.findMany({
      where: { iglesia_id: superAdmin.iglesia_id },
      select: {
        id: true,
        email: true,
        rol: true,
        persona_id: true,
        estado: true,
      },
    });

    return NextResponse.json({
      superadmin: {
        id: superAdmin.id,
        email: superAdmin.email,
        persona_id: superAdmin.persona_id,
        linkedPersona: superAdmin.persona
          ? { id: superAdmin.persona.id, nombre: superAdmin.persona.nombre, correo: superAdmin.persona.correo }
          : null,
      },
      personasInChurch: personas,
      usuariosInChurch: usuarios,
      churchId: superAdmin.iglesia_id,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message });
  }
}
