import { prisma } from "@/lib/db";
import { expressError, handle, json } from "@/lib/api/express";
import { getCurrentUser, isAdmin } from "@/lib/auth/access";
import { paymentFromSubmission } from "@/lib/services/attendance";
import type { StoredSubmission } from "@/lib/services/attendance";
import type { EventInfo } from "@/lib/types/event";

/**
 * GET /api/form/payments/:id — admin only.
 *
 * Payment proof for one event's registrations: who paid, what they declared as
 * their UTR, and the screenshot they uploaded.
 *
 * There is no Express counterpart. The original had no way to see an uploaded
 * screenshot at all — the upload path was commented out in `addRegistration.js`
 * and the register route discarded file parts — so verifying a payment meant
 * taking the typed UTR on faith.
 *
 * The answers live inside a free-form `sections` blob that admins can rename
 * and reorder, so fields are located by shape and by name pattern rather than
 * by a fixed index.
 */




export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/form/payments/[id]">,
) {
  return handle(async () => {
    const user = await getCurrentUser();
    if (!user) return expressError(401, "Token is required");
    if (!isAdmin(user)) return expressError(403, "Unauthorized");

    const { id } = await ctx.params;
    if (!/^[a-f\d]{24}$/i.test(id)) return expressError(404, "Form not found");

    const form = await prisma.form.findUnique({
      where: { id },
      select: { info: true },
    });
    if (!form) return expressError(404, "Form not found");

    const info = (form.info ?? {}) as EventInfo;

    const registrations = await prisma.formRegistration.findMany({
      where: { formId: id },
      select: { id: true, teamName: true, teamCode: true, value: true },
    });

    const payments = registrations.flatMap((registration) =>
      (registration.value ?? []).map((entry) => {
        const submission = entry as StoredSubmission;
        const payment = paymentFromSubmission(submission);

        return {
          registrationId: registration.id,
          teamName: registration.teamName,
          teamCode: registration.teamCode,
          userName: submission.user_name ?? "",
          userEmail: submission.user_email ?? "",
          registeredAt: submission.date_time ?? "",
          amount: submission.amount ?? String(info.eventAmount ?? "0"),
          utr: payment.utr,
          screenshot: payment.screenshot,
        };
      }),
    );

    return json({
      success: true,
      eventTitle: info.eventTitle ?? "",
      eventType: info.eventType ?? "Free",
      eventAmount: String(info.eventAmount ?? "0"),
      count: payments.length,
      payments,
    });
  });
}
