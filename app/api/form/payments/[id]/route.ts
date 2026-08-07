import { prisma } from "@/lib/db";
import { expressError, handle, json } from "@/lib/api/express";
import { getCurrentUser, isAdmin } from "@/lib/auth/access";
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

type StoredField = { name?: string; type?: string; value?: unknown };
type StoredSection = { name?: string; fields?: StoredField[] };
type StoredSubmission = {
  user_name?: string;
  user_email?: string;
  date_time?: string;
  amount?: string;
  sections?: StoredSection[];
};

const isHttpUrl = (v: unknown): v is string =>
  typeof v === "string" && /^https?:\/\//i.test(v);

/** Every field across every section, flattened — sections are admin-editable. */
function allFields(submission: StoredSubmission): StoredField[] {
  return (submission.sections ?? []).flatMap((section) =>
    Array.isArray(section?.fields) ? section.fields : [],
  );
}

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
        const fields = allFields(submission);

        const utr = fields.find((field) =>
          /utr|transaction/i.test(field?.name ?? ""),
        );

        // Matched on the stored URL rather than on `type`, because a field the
        // admin renamed still uploads to the same place, and a media field that
        // was never filled in is null.
        const screenshot = fields.find(
          (field) =>
            (field?.type === "image" || field?.type === "file") &&
            isHttpUrl(field?.value),
        );

        return {
          registrationId: registration.id,
          teamName: registration.teamName,
          teamCode: registration.teamCode,
          userName: submission.user_name ?? "",
          userEmail: submission.user_email ?? "",
          registeredAt: submission.date_time ?? "",
          amount: submission.amount ?? String(info.eventAmount ?? "0"),
          utr: utr?.value == null ? "" : String(utr.value),
          screenshot: isHttpUrl(screenshot?.value) ? screenshot.value : null,
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
