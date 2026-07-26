import { cookies } from "next/headers";

export async function getActiveChurchId(): Promise<string> {
  try {
    const cookieStore = await cookies();
    const activeId = cookieStore.get("active_iglesia_id")?.value;
    if (activeId) {
      return activeId;
    }
  } catch (e) {
    // cookies() may throw when executed outside a request context (like prerendering)
  }
  return "iglesia-default";
}
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
