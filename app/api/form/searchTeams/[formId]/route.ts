import { searchTeams } from "@/lib/services/teams";
import { expressError, handle, json } from "@/lib/api/express";
import { getCurrentUser } from "@/lib/auth/access";

/**
 * GET /api/form/searchTeams/:formId?search=
 * Port of controllers/registration/searchTeams.js — teams with room left.
 *
 * Two details the UI depends on: the query parameter is `search` (this route
 * read `q`, which `TeamlessState.jsx` never sends, so typing in the box filtered
 * nothing), and the list is nested as `data.teams` — the component reads
 * `response.data.data.teams`.
 */
export async function GET(
  request: Request,
  ctx: RouteContext<"/api/form/searchTeams/[formId]">,
) {
  return handle(async () => {
    const user = await getCurrentUser();
    if (!user) return expressError(401, "Token is required");

    const { formId } = await ctx.params;
    if (!formId) return expressError(400, "Form ID is required");

    const search = new URL(request.url).searchParams.get("search") ?? "";
    const teams = await searchTeams(formId, search, user.email);

    return json({ success: true, data: { teams } });
  });
}
