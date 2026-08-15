import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/active-church";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const user = await prisma.usuario.findUnique({ where: { id: userId } });
  if (!user || user.rol !== "SUPERADMIN") {
    return NextResponse.json({ error: "Acceso restringido a SuperAdministrador" }, { status: 403 });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID || "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  const dbUrl = process.env.DATABASE_URL || "";

  return NextResponse.json({
    hasClientId: !!clientId,
    clientIdPrefix: clientId.substring(0, 12) + "...",
    clientIdLength: clientId.length,
    hasClientSecret: !!clientSecret,
    clientSecretPrefix: clientSecret.substring(0, 8) + "...",
    clientSecretLength: clientSecret.length,
    appUrl,
    hasAppUrl: !!appUrl,
    redirectUri: appUrl ? `${appUrl}/api/auth/google/callback` : "NO_APP_URL",
    nodeEnv: process.env.NODE_ENV,
    hasDatabaseUrl: !!dbUrl,
    dbUrlLength: dbUrl.length,
    dbUrlPrefix: dbUrl.substring(0, 20) + "...",
    dbUrlHasTrailingNewline: dbUrl.endsWith("\n") || dbUrl.endsWith("\r"),
    dbUrlHasTrailingSpace: dbUrl.endsWith(" "),
    dbUrlChars: dbUrl.split("").map((c, i) => i < 5 || i > dbUrl.length - 5 ? c : (c === ":" ? ":" : c === "/" ? "/" : c === "@" ? "@" : c === "." ? "." : "*")).join(""),
  });
}

