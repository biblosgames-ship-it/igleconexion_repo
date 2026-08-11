import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getActiveChurchId } from "@/lib/active-church";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const target = searchParams.get("target") || "/hub";
    const requestedRole = searchParams.get("role")?.toUpperCase() || "LIDER";

    const defaultIglesiaId = await getActiveChurchId();
    const cookieStore = await cookies();

    // Buscar primero un usuario líder/admin activo de la iglesia
    let user = await prisma.usuario.findFirst({
      where: {
        iglesia_id: defaultIglesiaId,
        rol: { in: ["SUPERADMIN", "ADMIN_IGLESIA", "LIDER"] },
        estado: "ACTIVO"
      },
      orderBy: { createdAt: "asc" }
    });

    // Si no hay usuario específico en esa iglesia, tomar el usuario principal o SuperAdmin
    if (!user) {
      user = await prisma.usuario.findFirst({
        where: { estado: "ACTIVO" },
        orderBy: { createdAt: "asc" }
      });
    }

    if (!user) {
      return NextResponse.json({ error: "No se encontró ningún usuario activo en el sistema." }, { status: 404 });
    }

    // Configurar cookies de sesión inmediata
    const targetChurchId = user.iglesia_id || defaultIglesiaId;
    cookieStore.set("session_user_id", user.id, { path: "/", httpOnly: true });
    cookieStore.set("active_iglesia_id", targetChurchId, { path: "/", httpOnly: true });
    cookieStore.set("viewing_as_role", requestedRole || user.rol, { path: "/", httpOnly: true });

    // Redirigir directamente al destino deseado (Hub, Liderazgo o Admin)
    const redirectUrl = new URL(target, request.url);
    return NextResponse.redirect(redirectUrl);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
