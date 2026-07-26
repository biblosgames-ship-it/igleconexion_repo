import { NextResponse } from "next/server";

export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID || "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";

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
  });
}
