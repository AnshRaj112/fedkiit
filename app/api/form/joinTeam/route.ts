import { joinTeam } from "@/lib/services/teams";
import { body, expressError, handle, json } from "@/lib/api/express";
import { getCurrentUser } from "@/lib/auth/access";

/**
 * POST /api/form/joinTeam
 * Port of controllers/registration/joinTeam.js.
 */
export async function POST(request: Request) {
  return handle(async () => {
    const user = await getCurrentUser();
    if (!user) return expressError(401, "Token is required");

    const b = await body<{ formId?: string; teamCode?: string }>(request);
    if (!b.formId || !b.teamCode) {
      return expressError(400, "Form ID and team code are required");
    }

    const data = await joinTeam({
      user,
      formId: b.formId,
      teamCode: b.teamCode,
    });

    return json({
      success: true,
      message: `Successfully joined team "${data.teamName}"!`,
      data,
    });
  });
}
