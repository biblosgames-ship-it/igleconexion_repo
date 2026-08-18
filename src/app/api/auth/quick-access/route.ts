import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getActiveChurchId, setSessionCookie } from "@/lib/active-church";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug")?.trim().toLowerCase();

    let targetChurchId = await getActiveChurchId();

    if (slug) {
      const iglesia = await prisma.iglesia.findFirst({
        where: { subdominio_o_slug: slug }
      });
      if (iglesia) {
        targetChurchId = iglesia.id;
      }
    }

    const cookieStore = await cookies();

    // 1. Buscar primero un usuario miembro activo de la iglesia
    let user = await prisma.usuario.findFirst({
      where: {
        iglesia_id: targetChurchId,
        rol: "MIEMBRO",
        estado: "ACTIVO"
      },
      orderBy: { createdAt: "asc" }
    });

    // 2. Si no hay miembro, buscar cualquier usuario activo para dar contexto de sesión
    if (!user) {
      user = await prisma.usuario.findFirst({
        where: {
          iglesia_id: targetChurchId,
          estado: "ACTIVO"
        },
        orderBy: { createdAt: "asc" }
      });
    }

    // 3. Si no existe usuario en la iglesia, crear usuario invitado de miembro para acceso al hub
    if (!user) {
      user = await prisma.usuario.create({
        data: {
          iglesia_id: targetChurchId,
          email: `visita_${targetChurchId.substring(0, 8)}@igleconexion.app`,
          password: "guest_hub_access",
          rol: "MIEMBRO",
          estado: "ACTIVO"
        }
      });
    }

    // Configurar cookies fijando la iglesia y rol exclusivamente de MIEMBRO para el Hub
    await setSessionCookie(user.id);
    cookieStore.set("active_iglesia_id", targetChurchId, { 
      path: "/", 
      maxAge: 30 * 24 * 60 * 60, 
      sameSite: "lax", 
      httpOnly: true, 
      secure: process.env.NODE_ENV === "production" 
    });
    cookieStore.set("viewing_as_role", "MIEMBRO", { 
      path: "/", 
      maxAge: 30 * 24 * 60 * 60, 
      sameSite: "lax", 
      httpOnly: true, 
      secure: process.env.NODE_ENV === "production" 
    });

    // Redirección estricta y segura únicamente al Hub congregacional
    const redirectUrl = new URL("/hub", request.url);
    return NextResponse.redirect(redirectUrl);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

