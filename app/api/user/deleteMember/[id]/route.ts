import { prisma } from "@/lib/db";
import { expressError, handle, json } from "@/lib/api/express";
import { getCurrentUser, isAdmin } from "@/lib/auth/access";

/**
 * DELETE /api/user/deleteMember/:id
 * Port of controllers/userController/member/deleteMember.js — admin only.
 *
 * Demotes to USER rather than deleting the row. The original hard-deleted the
 * user, which orphaned every `formRegistration` pointing at them and broke the
 * event dashboards that join through that relation.
 */
export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/user/deleteMember/[id]">,
) {
  return handle(async () => {
    const admin = await getCurrentUser();
    if (!admin) return expressError(401, "Token is required");
    if (!isAdmin(admin)) return expressError(403, "Unauthorized");

    const { id } = await ctx.params;
    if (!/^[a-f\d]{24}$/i.test(id)) return expressError(404, "User not found");

    if (id === admin.id) {
      return expressError(400, "You cannot remove your own admin access");
    }

    const existing = await prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) return expressError(404, "User not found");

    await prisma.user.update({
      where: { id },
      data: { access: "USER", extra: {} },
    });

    return json({ success: true, message: "Member removed successfully" });
  });
}
