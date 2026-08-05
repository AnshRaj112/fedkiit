import { createTeam } from "@/lib/services/teams";
import { body, expressError, handle, json } from "@/lib/api/express";
import { getCurrentUser } from "@/lib/auth/access";

/**
 * POST /api/form/createTeam
 * Port of controllers/registration/createTeam.js.
 */
export async function POST(request: Request) {
  return handle(async () => {
    const user = await getCurrentUser();
    if (!user) return expressError(401, "Token is required");

    const b = await body<{ formId?: string; teamName?: string }>(request);
    if (!b.formId || !b.teamName) {
      return expressError(400, "Form ID and team name are required");
    }

    const data = await createTeam({
      user,
      formId: b.formId,
      teamName: b.teamName,
    });

    // TeamlessState.jsx shows this verbatim, so it names the team as before.
    return json({
      success: true,
      message: `Team "${data.teamName}" created successfully!`,
      data,
    });
  });
}
