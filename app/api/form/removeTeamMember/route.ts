import { removeTeamMember } from "@/lib/services/teams";
import { body, expressError, handle, json } from "@/lib/api/express";
import { getCurrentUser } from "@/lib/auth/access";

/**
 * POST /api/form/removeTeamMember
 * Port of controllers/registration/removeTeamMember.js.
 *
 * Body is `{ formId, memberEmail }`. The message names both the address as
 * typed and the normalised one the notification went to, as the original did —
 * TeamManagement.jsx shows it verbatim in a toast.
 */
export async function POST(request: Request) {
  return handle(async () => {
    const user = await getCurrentUser();
    if (!user) return expressError(401, "Token is required");

    const b = await body<{ formId?: string; memberEmail?: string }>(request);
    if (!b.formId || !b.memberEmail) {
      return expressError(400, "Form ID and member email are required");
    }

    const { memberEmail, normalizedEmail } = await removeTeamMember({
      user,
      formId: b.formId,
      memberEmail: b.memberEmail,
    });

    return json({
      success: true,
      message: `Successfully removed ${memberEmail} from the team & informed through ${normalizedEmail}`,
    });
  });
}
