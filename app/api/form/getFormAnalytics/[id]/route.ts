import { prisma } from "@/lib/db";
import { expressError, handle, json } from "@/lib/api/express";
import { getCurrentUser, isMember } from "@/lib/auth/access";

/**
 * GET /api/form/getFormAnalytics/:id
 * Port of controllers/forms/analytics.js.
 *
 * Requires a club member: the original was mounted without any access check, so
 * the full registrant email list of any event was readable by anyone signed in.
 */
export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/form/getFormAnalytics/[id]">,
) {
  return handle(async () => {
    const user = await getCurrentUser();
    if (!user) return expressError(401, "Token is required");
    if (!isMember(user)) return expressError(403, "Unauthorized");

    const { id } = await ctx.params;
    if (!/^[a-f\d]{24}$/i.test(id)) return expressError(404, "Form not found");

    const form = await prisma.form.findUnique({
      where: { id },
      include: { formAnalytics: true, userReg: true },
    });
    if (!form) return expressError(404, "Form not found");

    const tracker = form.formAnalytics[0] ?? null;

    return json({
      success: true,
      message: "Analytics fetched successfully",
      data: {
        formId: id,
        info: form.info,
        totalRegistrationCount:
          tracker?.totalRegistrationCount ?? form.userReg.length,
        totalClickCount: tracker?.totalClickCount ?? 0,
        regUserEmails: tracker?.regUserEmails ?? [],
        regTeamNames: tracker?.regTeamNames ?? [],
        faildAttemptCount: tracker?.faildAttemptCount ?? 0,
        registrations: form.userReg,
      },
    });
  });
}
