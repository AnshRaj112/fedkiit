import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";
import { expressError, handle, json } from "@/lib/api/express";
import { canManageBlogs, getCurrentUser } from "@/lib/auth/access";

/**
 * DELETE /api/blog/deleteBlog/:id
 * Port of controllers/blog/deleteBlog.js.
 */
export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/blog/deleteBlog/[id]">,
) {
  return handle(async () => {
    const user = await getCurrentUser();
    if (!user) return expressError(401, "Token is required");
    if (!canManageBlogs(user)) return expressError(403, "Unauthorized");

    const { id } = await ctx.params;
    if (!/^[a-f\d]{24}$/i.test(id)) return expressError(404, "Blog not found");

    const existing = await prisma.blog.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) return expressError(404, "Blog not found");

    await prisma.blog.delete({ where: { id } });
    revalidatePath("/Blog");

    return json({ success: true, message: "Blog deleted successfully" });
  });
}
