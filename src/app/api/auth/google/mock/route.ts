import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: "Falta el correo electrónico para simular" }, { status: 400 });
    }

    // 1. Buscar usuario
    const user = await prisma.usuario.findUnique({
      where: { email: email.trim() },
      include: { iglesia: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: `El correo de Google (${email}) no está registrado en el sistema. Regístrate o contacta a tu administrador.` },
        { status: 404 }
      );
    }

    // 2. Validar suspensiones
    if (user.rol !== "SUPERADMIN") {
      if (user.iglesia.estado === "SUSPENDIDO") {
        return NextResponse.json({ error: "La iglesia correspondiente a esta cuenta ha sido suspendida." }, { status: 403 });
      }
      if (user.iglesia.estado_pago === "VENCIDO" || (user.iglesia.fecha_vencimiento && new Date(user.iglesia.fecha_vencimiento).getTime() < Date.now())) {
        return NextResponse.json({ error: "La licencia de su iglesia ha vencido o el pago mensual está pendiente." }, { status: 403 });
      }
      if (user.estado === "SUSPENDIDO") {
        return NextResponse.json({ error: "Su cuenta de usuario ha sido suspendida." }, { status: 403 });
      }
    }

    // 3. Autenticar estableciendo cookies
    const cookieStore = await cookies();
    cookieStore.set("session_user_id", user.id, { path: "/", maxAge: 31536000, httpOnly: true, secure: true });
    cookieStore.set("active_iglesia_id", user.iglesia_id, { path: "/", maxAge: 31536000, httpOnly: true, secure: true });

    // 4. Determinar ruta de redirección
    let redirect = "/hub";
    if (user.rol === "SUPERADMIN") {
      redirect = "/superadmin";
    } else if (user.rol === "ADMIN_IGLESIA") {
      redirect = "/admin";
    } else if (user.rol === "LIDER") {
      redirect = "/lider";
    }

    return NextResponse.json({ success: true, redirect });
  } catch (error: any) {
    console.error("Mock Google Sign-In Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
