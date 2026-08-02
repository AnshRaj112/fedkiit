import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";
import { expressError, handle, json } from "@/lib/api/express";
import { getCurrentUser, isAdmin } from "@/lib/auth/access";

/**
 * DELETE /api/form/deleteForm/:id
 * Port of controllers/forms/deleteForm.js — admin only.
 *
 * Registrations and the tracker are removed first: Mongo has no cascading
 * delete, and the original left both behind, so a deleted event kept its rows
 * forever and users could never re-register for a re-created event with the
 * same id.
 */
export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/form/deleteForm/[id]">,
) {
  return handle(async () => {
    const user = await getCurrentUser();
    if (!user) return expressError(401, "Token is required");
    if (!isAdmin(user)) return expressError(403, "Unauthorized");

    const { id } = await ctx.params;
    if (!/^[a-f\d]{24}$/i.test(id)) {
      return expressError(404, "Form not found");
    }

    const existing = await prisma.form.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) return expressError(404, "Form not found");

    await prisma.$transaction([
      prisma.formRegistration.deleteMany({ where: { formId: id } }),
      prisma.registrationTracker.deleteMany({ where: { formId: id } }),
      prisma.teamJoinRequest.deleteMany({ where: { formId: id } }),
      prisma.attendance.deleteMany({ where: { formId: id } }),
      prisma.form.delete({ where: { id } }),
    ]);

    revalidatePath("/Events");

    return json({ success: true, message: "Form deleted successfully" });
  });
}
