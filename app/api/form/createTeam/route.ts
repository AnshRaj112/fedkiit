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

    const b = await body<Record<string, string>>(request);
    const data = await createTeam({ user, formId: b.formId ?? b._id, teamName: b.teamName ?? '' });

    return json({ success: true, message: "Team created successfully", data });
  });
}
