import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getActiveChurchId } from "@/lib/active-church";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const target = searchParams.get("target") || "/hub";
    const requestedRole = searchParams.get("role")?.toUpperCase() || "LIDER";
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

    let user = null;

    if (requestedRole === "MIEMBRO" || requestedRole === "USUARIO") {
      // Buscar primero un usuario con rol de miembro común
      user = await prisma.usuario.findFirst({
        where: {
          iglesia_id: targetChurchId,
          rol: "MIEMBRO",
          estado: "ACTIVO"
        },
        orderBy: { createdAt: "asc" }
      });
    }

    // Si no se encontró usuario miembro o se pidió rol de Líder/Admin
    if (!user) {
      user = await prisma.usuario.findFirst({
        where: {
          iglesia_id: targetChurchId,
          estado: "ACTIVO"
        },
        orderBy: { createdAt: "asc" }
      });
    }

    if (!user) {
      user = await prisma.usuario.findFirst({
        where: { estado: "ACTIVO" },
        orderBy: { createdAt: "asc" }
      });
    }

    if (!user) {
      return NextResponse.json({ error: "No se encontró ningún usuario activo en la iglesia solicitada." }, { status: 404 });
    }

    const effectiveRole = (requestedRole === "MIEMBRO" || requestedRole === "USUARIO") ? "MIEMBRO" : (requestedRole || user.rol);

    // Configurar cookies fijando la iglesia exacta y el rol elegido
    cookieStore.set("session_user_id", user.id, { path: "/", httpOnly: true });
    cookieStore.set("active_iglesia_id", targetChurchId, { path: "/", httpOnly: true });
    cookieStore.set("viewing_as_role", effectiveRole, { path: "/", httpOnly: true });

    // Si el usuario entra como MIEMBRO y el destino es /admin, redirigir al Hub por seguridad
    let finalTarget = target;
    if (effectiveRole === "MIEMBRO" && target.startsWith("/admin")) {
      finalTarget = "/hub";
    }

    const redirectUrl = new URL(finalTarget, request.url);
    return NextResponse.redirect(redirectUrl);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
