import { removeTeamMember } from "@/lib/services/teams";
import { body, expressError, handle, json } from "@/lib/api/express";
import { getCurrentUser } from "@/lib/auth/access";

/**
 * POST /api/form/removeTeamMember
 * Port of controllers/registration/removeTeamMember.js.
 */
export async function POST(request: Request) {
  return handle(async () => {
    const user = await getCurrentUser();
    if (!user) return expressError(401, "Token is required");

    const b = await body<Record<string, string>>(request);
    const data = await removeTeamMember({ user, formId: b.formId ?? b._id, email: b.email ?? b.memberEmail ?? '' });

    return json({ success: true, message: "Member removed successfully", data });
  });
}
