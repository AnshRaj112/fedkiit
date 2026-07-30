import { checkAllJoinRequestUpdates } from "@/lib/services/team-invites";
import { expressError, handle, json } from "@/lib/api/express";
import { getCurrentUser } from "@/lib/auth/access";

/**
 * GET /api/form/allJoinRequestUpdates
 * Port of controllers/registration/checkAllJoinRequestUpdates.js.
 *
 * App.jsx polls this on login to surface accept/decline toasts, so an
 * unauthenticated caller gets an empty list rather than a 401 — a 401 here
 * would log an error on every anonymous page load.
 */
export async function GET() {
  return handle(async () => {
    const user = await getCurrentUser();
    if (!user) return json({ success: true, data: { updates: [] } });

    const data = await checkAllJoinRequestUpdates(user);
    return json({ success: true, data });
  });
}
