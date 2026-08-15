import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import * as jose from "jose";

const JWT_SECRET_STRING = process.env.JWT_SECRET || "igleconexion_jwt_secret_key_2026_super_secure_9987";
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STRING);

export async function createSessionToken(userId: string): Promise<string> {
  return await new jose.SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(JWT_SECRET);
}

export async function verifySessionToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET);
    if (payload && typeof payload.userId === "string") {
      return payload.userId;
    }
  } catch (error) {
    // Token is invalid, expired, or tampered with
  }
  return null;
}

export async function setSessionCookie(userId: string) {
  const token = await createSessionToken(userId);
  const cookieStore = await cookies();
  cookieStore.set("session_token", token, {
    path: "/",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production"
  });
  // Clean up legacy unsigned cookie if present
  cookieStore.delete("session_user_id");
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete("session_token");
  cookieStore.delete("session_user_id");
  cookieStore.delete("active_iglesia_id");
  cookieStore.delete("viewing_as_role");
}

export async function getSessionUserId(): Promise<string | undefined> {
  try {
    const cookieStore = await cookies();
    
    // 1. Primary: Check signed JWT session token
    const token = cookieStore.get("session_token")?.value;
    if (token) {
      const userId = await verifySessionToken(token);
      if (userId) return userId;
    }

    // 2. Fallback / Migration: Check legacy session_user_id only if verified in database
    const legacySessionUserId = cookieStore.get("session_user_id")?.value;
    if (legacySessionUserId) {
      // Validate format to prevent arbitrary string injection
      const userExists = await prisma.usuario.findUnique({
        where: { id: legacySessionUserId },
        select: { id: true }
      });
      if (userExists) {
        return legacySessionUserId;
      }
    }
  } catch (e) {
    // cookies() may throw when executed outside a request context
  }
  return undefined;
}

export async function getAuthenticatedUserAndChurch() {
  const userId = await getSessionUserId();
  if (!userId) return { user: null, iglesiaId: null };

  try {
    const user = await prisma.usuario.findUnique({
      where: { id: userId },
      include: { persona: true }
    });

    if (!user) return { user: null, iglesiaId: null };

    const cookieStore = await cookies();
    const cookieActiveChurchId = cookieStore.get("active_iglesia_id")?.value;

    // SuperAdmins are allowed to switch active church via cookie
    if (user.rol === "SUPERADMIN" && cookieActiveChurchId) {
      return { user, iglesiaId: cookieActiveChurchId };
    }

    // For all regular users (ADMIN_IGLESIA, MIEMBRO, LIDER), ALWAYS strictly enforce their user.iglesia_id
    return { user, iglesiaId: user.iglesia_id };
  } catch (error) {
    console.error("Error resolving authenticated user and church context:", error);
    return { user: null, iglesiaId: null };
  }
}

export async function getActiveChurchId(): Promise<string> {
  try {
    const { user, iglesiaId } = await getAuthenticatedUserAndChurch();
    if (iglesiaId) {
      return iglesiaId;
    }

    // Unauthenticated context fallback (e.g. public pages selecting church)
    const cookieStore = await cookies();
    const activeId = cookieStore.get("active_iglesia_id")?.value;
    if (activeId) {
      return activeId;
    }

    // Final fallback: return first church ID from DB if available, or default string
    const firstChurch = await prisma.iglesia.findFirst({ select: { id: true } });
    if (firstChurch) {
      return firstChurch.id;
    }
  } catch (e) {
    // cookies() or prisma may fail outside request context
  }
  return "iglesia-default";
}

