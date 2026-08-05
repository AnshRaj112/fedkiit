import { prisma } from "@/lib/db";
import { expressError, handle, json } from "@/lib/api/express";
import { getCurrentUser } from "@/lib/auth/access";
import type { EventInfo } from "@/lib/types/event";

/**
 * GET /api/form/teamDetails/:formId
 * Port of controllers/registration/getTeamDetails.js.
 *
 * Drives the whole team management page, so the payload has to match field for
 * field: `TeamManagement.jsx` reads `data.isTeamless`, `teamData.eventTitle`,
 * `.leaderEmail`, `.maxTeamSize`, `.minTeamSize`, `.teamSize`, `.teamCode`,
 * `.teamName`, `.members`, `.isRegistrationClosed` and `.isEventPast`, and
 * `MemberCard.jsx` reads `member.name/email/img/college/year`.
 *
 * The registration is looked up by **membership**, not ownership. An earlier
 * version matched on `userId`, which is only ever the team leader's id — so
 * every other member of a team got "no registration found" and an empty page.
 */
export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/form/teamDetails/[formId]">,
) {
  return handle(async () => {
    const user = await getCurrentUser();
    if (!user) return expressError(401, "Token is required");

    const { formId } = await ctx.params;
    if (!formId) return expressError(400, "Form ID is required");
    // A malformed id makes Prisma throw; answer as "not found" instead.
    if (!/^[a-f\d]{24}$/i.test(formId)) {
      return expressError(
        404,
        "No team registration found for this user in the specified form",
      );
    }

    const teamRegistration = await prisma.formRegistration.findFirst({
      where: { formId, regTeamMemEmails: { has: user.email } },
      include: { form: { select: { info: true } } },
    });

    if (!teamRegistration) {
      return expressError(
        404,
        "No team registration found for this user in the specified form",
      );
    }

    const info = (teamRegistration.form.info ?? {}) as EventInfo;

    if (info.participationType !== "Team") {
      return expressError(400, "This is not a team event");
    }

    const maxTeamSize = Number.parseInt(String(info.maxTeamSize ?? ""), 10) || 1;
    const minTeamSize = Number.parseInt(String(info.minTeamSize ?? ""), 10) || 1;

    // Registered for the event but not yet on a team — the UI swaps in
    // TeamlessState, which needs the event's limits to offer team creation.
    if (teamRegistration.teamName === "UNAFFILIATED") {
      return json({
        success: true,
        message: "User is registered but not yet on a team",
        data: {
          isTeamless: true,
          eventTitle: info.eventTitle,
          maxTeamSize,
          minTeamSize,
          isRegistrationClosed: info.isRegistrationClosed || false,
          isEventPast: info.isEventPast || false,
          formId: teamRegistration.formId,
        },
      });
    }

    const members = await prisma.user.findMany({
      where: { email: { in: teamRegistration.regTeamMemEmails } },
      select: {
        name: true,
        email: true,
        img: true,
        rollNumber: true,
        college: true,
        year: true,
      },
    });

    // `userId` on the registration is the leader; the UI compares this against
    // the signed-in user to decide who may rename, invite and remove.
    const leaderUser = await prisma.user.findUnique({
      where: { id: teamRegistration.userId },
      select: { email: true },
    });

    return json({
      success: true,
      message: "Team details retrieved successfully",
      data: {
        teamName: teamRegistration.teamName,
        teamCode: teamRegistration.teamCode,
        teamSize: teamRegistration.teamSize,
        maxTeamSize,
        minTeamSize,
        members,
        eventTitle: info.eventTitle,
        leaderEmail: leaderUser?.email || null,
        isRegistrationClosed: info.isRegistrationClosed || false,
        isEventPast: info.isEventPast || false,
        formId: teamRegistration.formId,
      },
    });
  });
}
