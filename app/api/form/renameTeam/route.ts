import { renameTeam } from "@/lib/services/teams";
import { body, expressError, handle, json } from "@/lib/api/express";
import { getCurrentUser } from "@/lib/auth/access";

/**
 * PATCH /api/form/renameTeam
 * Port of controllers/registration/renameTeam.js.
 *
 * Body is `{ formId, newTeamName }`. This route previously read `teamName`,
 * which TeamManagement.jsx never sends, so every rename failed on an empty
 * name. The success message echoes the new name because the UI surfaces it.
 */
export async function PATCH(request: Request) {
  return handle(async () => {
    const user = await getCurrentUser();
    if (!user) return expressError(401, "Token is required");

    const b = await body<{ formId?: string; newTeamName?: string }>(request);
    if (!b.formId || !b.newTeamName) {
      return expressError(400, "Form ID and new team name are required");
    }

    const data = await renameTeam({
      user,
      formId: b.formId,
      teamName: b.newTeamName,
    });

    // The controller answers 200 "Team name unchanged" when the submitted name
    // matches the current one, rather than treating it as a duplicate.
    return json({
      success: true,
      message: data.unchanged
        ? "Team name unchanged"
        : `Team renamed to "${data.teamName}"`,
      data: { teamName: data.teamName },
    });
  });
}
