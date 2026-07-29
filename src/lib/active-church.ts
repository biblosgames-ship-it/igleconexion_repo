import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function getSessionUserId(): Promise<string | undefined> {
  try {
    const cookieStore = await cookies();
    const sessionUserId = cookieStore.get("session_user_id")?.value;
    if (sessionUserId) {
      return sessionUserId;
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
