import { prisma } from "@/lib/db";
import { expressError, handle, json } from "@/lib/api/express";
import { getCurrentUser } from "@/lib/auth/access";

/**
 * GET /api/form/teamDetails/:formId
 * Port of controllers/registration/getTeamDetails.js.
 *
 * Returns only the caller's own registration for the form — the original looked
 * the record up by form alone in places, which exposed other teams' member
 * lists.
 */
export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/form/teamDetails/[formId]">,
) {
  return handle(async () => {
    const user = await getCurrentUser();
    if (!user) return expressError(401, "Token is required");

    const { formId } = await ctx.params;
    if (!/^[a-f\d]{24}$/i.test(formId)) {
      return expressError(404, "Form not found");
    }

    const registration = await prisma.formRegistration.findFirst({
      where: { formId, userId: user.id },
    });

    if (!registration) {
      return json({
        success: true,
        message: "No registration found",
        data: null,
      });
    }

    // Everyone on the same team code, so the UI can list teammates.
    const teammates = await prisma.formRegistration.findMany({
      where: { formId, teamCode: registration.teamCode },
      select: { regTeamMemEmails: true, teamSize: true },
    });

    const memberEmails = [
      ...new Set(teammates.flatMap((t) => t.regTeamMemEmails)),
    ];

    const members = await prisma.user.findMany({
      where: { email: { in: memberEmails } },
      select: { name: true, email: true, img: true },
    });

    return json({
      success: true,
      message: "Team details fetched successfully",
      data: {
        registrationId: registration.id,
        teamName: registration.teamName,
        teamCode: registration.teamCode,
        teamSize: registration.teamSize,
        regTeamMemEmails: registration.regTeamMemEmails,
        members,
        isLeader: registration.userId === user.id,
      },
    });
  });
}
