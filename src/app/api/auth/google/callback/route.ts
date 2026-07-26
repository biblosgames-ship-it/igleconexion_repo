import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (!code) {
    return NextResponse.redirect(`${appUrl}?error=No se recibió código de autorización de Google.`);
  }

  try {
    // 1. Intercambiar código por tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID || "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
        redirect_uri: `${appUrl}/api/auth/google/callback`,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      console.error("Token exchange error:", tokenData);
      return NextResponse.redirect(`${appUrl}?error=Error al intercambiar código con Google.`);
    }

    // 2. Obtener información del usuario
    const userResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const userInfo = await userResponse.json();
    const email = userInfo.email;

    if (!email) {
      return NextResponse.redirect(`${appUrl}?error=No se pudo obtener el correo de la cuenta de Google.`);
    }

    // 3. Buscar usuario en la base de datos
    const user = await prisma.usuario.findUnique({
      where: { email },
      include: { iglesia: true },
    });

    if (!user) {
      return NextResponse.redirect(`${appUrl}?error=El correo de Google (${email}) no está registrado en el sistema. Regístrate o contacta a tu administrador.`);
    }

    // 4. Validar suspensiones
    if (user.rol !== "SUPERADMIN") {
      if (user.iglesia.estado === "SUSPENDIDO") {
        return NextResponse.redirect(`${appUrl}?error=La iglesia correspondiente a esta cuenta ha sido suspendida.`);
      }
      if (user.iglesia.estado_pago === "VENCIDO" || (user.iglesia.fecha_vencimiento && new Date(user.iglesia.fecha_vencimiento).getTime() < Date.now())) {
        return NextResponse.redirect(`${appUrl}?error=La licencia de su iglesia ha vencido o el pago mensual está pendiente.`);
      }
      if (user.estado === "SUSPENDIDO") {
        return NextResponse.redirect(`${appUrl}?error=Su cuenta de usuario ha sido suspendida.`);
      }
      if (user.estado === "PENDIENTE") {
        return NextResponse.redirect(`${appUrl}?error=Su cuenta de usuario está pendiente de aprobación por el líder o administrador de su iglesia.`);
      }
    }

    // 5. Autenticar estableciendo cookies
    const cookieStore = await cookies();
    cookieStore.set("session_user_id", user.id, { path: "/", maxAge: 31536000 });
    cookieStore.set("active_iglesia_id", user.iglesia_id, { path: "/", maxAge: 31536000 });

    // 6. Redirigir basado en el rol
    if (user.rol === "SUPERADMIN") {
      return NextResponse.redirect(`${appUrl}/superadmin`);
    } else if (user.rol === "ADMIN_IGLESIA") {
      return NextResponse.redirect(`${appUrl}/admin`);
    } else if (user.rol === "LIDER") {
      return NextResponse.redirect(`${appUrl}/lider`);
    } else {
      return NextResponse.redirect(`${appUrl}/hub`);
    }

  } catch (err: any) {
    console.error("Google Auth Callback Error:", err);
    return NextResponse.redirect(`${appUrl}?error=Error interno del servidor durante la autenticación.`);
  }
}
