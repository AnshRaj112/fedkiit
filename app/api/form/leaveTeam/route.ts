import { leaveTeam } from "@/lib/services/teams";
import { body, expressError, handle, json } from "@/lib/api/express";
import { getCurrentUser } from "@/lib/auth/access";

/**
 * POST /api/form/leaveTeam
 * Port of controllers/registration/leaveTeam.js.
 */
export async function POST(request: Request) {
  return handle(async () => {
    const user = await getCurrentUser();
    if (!user) return expressError(401, "Token is required");

    const b = await body<Record<string, string>>(request);
    const data = await leaveTeam({ user, formId: b.formId ?? b._id });

    return json({ success: true, message: "Left the team successfully", data });
  });
}
