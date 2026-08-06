import { sendJoinRequest } from "@/lib/services/team-invites";
import { body, expressError, handle, json } from "@/lib/api/express";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/api/rate-limit";
import { getCurrentUser } from "@/lib/auth/access";

/**
 * POST /api/form/sendJoinRequest
 * Port of controllers/registration/sendJoinRequest.js.
 */
export async function POST(request: Request) {
  return handle(async () => {
    const user = await getCurrentUser();
    if (!user) return expressError(401, "Token is required");

    await enforceRateLimit({ ...RATE_LIMITS.registration, subject: user.id });

    const b = await body<Record<string, string>>(request);
    const data = await sendJoinRequest({
      user,
      formId: b.formId ?? b._id ?? "",
      teamCode: b.teamCode ?? "",
    });

    return json({ success: true, message: "Join request sent", data });
  });
}
