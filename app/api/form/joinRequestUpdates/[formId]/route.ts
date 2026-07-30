import { checkJoinRequestUpdates } from "@/lib/services/team-invites";
import { expressError, handle, json } from "@/lib/api/express";
import { getCurrentUser } from "@/lib/auth/access";

/**
 * GET /api/form/joinRequestUpdates/:formId
 * Port of controllers/registration/checkJoinRequestUpdates.js.
 */
export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/form/joinRequestUpdates/[formId]">,
) {
  return handle(async () => {
    const user = await getCurrentUser();
    if (!user) return expressError(401, "Token is required");

    const { formId } = await ctx.params;
    const data = await checkJoinRequestUpdates(formId, user);

    return json({ success: true, data });
  });
}
