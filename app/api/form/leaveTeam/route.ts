import { leaveTeam } from "@/lib/services/teams";
import { body, expressError, handle, json } from "@/lib/api/express";
import { getCurrentUser } from "@/lib/auth/access";

/**
 * POST /api/form/leaveTeam
 * Port of controllers/registration/leaveTeam.js.
 *
 * The message is built from the outcome because TeamManagement.jsx puts
 * `response.data.message` straight into the toast, and the original distinguishes
 * a leader dissolving a team from a member leaving one.
 */
export async function POST(request: Request) {
  return handle(async () => {
    const user = await getCurrentUser();
    if (!user) return expressError(401, "Token is required");

    const b = await body<{ formId?: string }>(request);
    if (!b.formId) return expressError(400, "Form ID is required");

    const { action, oldTeamName } = await leaveTeam({ user, formId: b.formId });

    return json({
      success: true,
      message: `Successfully ${action} the team "${oldTeamName}". You can now create or join another team.`,
    });
  });
}
