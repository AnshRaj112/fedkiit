import { inviteTeamMember } from "@/lib/services/team-invites";
import { body, expressError, handle, json } from "@/lib/api/express";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/api/rate-limit";
import { getCurrentUser } from "@/lib/auth/access";

/**
 * POST /api/form/inviteTeamMember
 * Port of controllers/registration/inviteTeamMember.js — leader only.
 *
 * Rate limited: it sends mail to an address supplied in the request body, so
 * without a limit it doubles as an open relay.
 */
export async function POST(request: Request) {
  return handle(async () => {
    const user = await getCurrentUser();
    if (!user) return expressError(401, "Token is required");

    await enforceRateLimit({ ...RATE_LIMITS.otpRequest, subject: user.id });

    const b = await body<Record<string, string>>(request);
    const data = await inviteTeamMember({
      user,
      formId: b.formId ?? b._id ?? "",
      inviteeEmail: b.inviteeEmail ?? b.email ?? "",
    });

    return json({ success: true, message: "Invitation sent", data });
  });
}
