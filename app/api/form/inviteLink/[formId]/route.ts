import { getTeamInviteLink } from "@/lib/services/team-invites";
import { expressError, handle, json } from "@/lib/api/express";
import { getCurrentUser } from "@/lib/auth/access";

/**
 * GET /api/form/inviteLink/:formId
 * Port of controllers/registration/getTeamInviteLink.js — leader only.
 */
export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/form/inviteLink/[formId]">,
) {
  return handle(async () => {
    const user = await getCurrentUser();
    if (!user) return expressError(401, "Token is required");

    const { formId } = await ctx.params;
    const data = await getTeamInviteLink(formId, user);

    return json({ success: true, data });
  });
}
