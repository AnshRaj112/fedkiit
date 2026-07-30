import { handle, json } from "@/lib/api/express";
import { clearSessionCookie } from "@/lib/auth/session";

/**
 * POST /api/auth/logout
 * Port of controllers/auth/logoutController.js — clears the session cookie.
 */
export async function POST() {
  return handle(async () => {
    await clearSessionCookie();
    return json({ success: true, message: "Logged out successfully" });
  });
}
