import { searchTeams } from "@/lib/services/teams";
import { expressError, handle, json } from "@/lib/api/express";
import { getCurrentUser } from "@/lib/auth/access";

/**
 * GET /api/form/searchTeams/:formId?q=
 * Port of controllers/registration/searchTeams.js — teams with room left.
 */
export async function GET(
  request: Request,
  ctx: RouteContext<"/api/form/searchTeams/[formId]">,
) {
  return handle(async () => {
    const user = await getCurrentUser();
    if (!user) return expressError(401, "Token is required");

    const { formId } = await ctx.params;
    const query = new URL(request.url).searchParams.get("q") ?? "";

    const teams = await searchTeams(formId, query);

    return json({ success: true, message: "Teams fetched successfully", data: teams });
  });
}
