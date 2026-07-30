import { renameTeam } from "@/lib/services/teams";
import { body, expressError, handle, json } from "@/lib/api/express";
import { getCurrentUser } from "@/lib/auth/access";

/**
 * PATCH /api/form/renameTeam
 * Port of controllers/registration/renameTeam.js.
 */
export async function PATCH(request: Request) {
  return handle(async () => {
    const user = await getCurrentUser();
    if (!user) return expressError(401, "Token is required");

    const b = await body<Record<string, string>>(request);
    const data = await renameTeam({ user, formId: b.formId ?? b._id, teamName: b.teamName ?? '' });

    return json({ success: true, message: "Team renamed successfully", data });
  });
}
