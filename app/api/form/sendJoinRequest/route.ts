import { sendJoinRequest } from "@/lib/services/team-invites";
import { body, expressError, handle, json } from "@/lib/api/express";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/api/rate-limit";
import { getCurrentUser } from "@/lib/auth/access";

/**
 * POST /api/form/sendJoinRequest
 * Port of controllers/registration/sendJoinRequest.js.
 *
 * Body is `{ formId, teamRegistrationId }` — the id `searchTeams` returns for
 * each team. This route previously looked for `teamCode`, which the UI never
 * sends, so every join request was rejected.
 */
export async function POST(request: Request) {
  return handle(async () => {
    const user = await getCurrentUser();
    if (!user) return expressError(401, "Token is required");

    await enforceRateLimit({ ...RATE_LIMITS.registration, subject: user.id });

    const b = await body<{ formId?: string; teamRegistrationId?: string }>(
      request,
    );
    if (!b.formId || !b.teamRegistrationId) {
      return expressError(400, "Form ID and team registration ID are required");
    }

    const data = await sendJoinRequest({
      user,
      formId: b.formId,
      teamRegistrationId: b.teamRegistrationId,
    });

    return json({
      success: true,
      message:
        "Join request sent to the team leader. They will receive an email with your request.",
      data,
    });
  });
}
