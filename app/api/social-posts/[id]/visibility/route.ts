import { prisma } from "@/lib/db";
import { handleRoute, ok, fail, readJson } from "@/lib/api/respond";

function isAuthorised(request: Request): boolean {
  const secret = request.headers.get("x-admin-secret");
  const expected = process.env.ADMIN_SECRET;
  if (!expected || !secret) return false;
  return secret === expected;
}

/**
 * PATCH /api/social-posts/[id]/visibility
 * Toggle the visibility of a social post. Requires `x-admin-secret` header.
 */
export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/social-posts/[id]/visibility">,
) {
  return handleRoute(async () => {
    if (!isAuthorised(request)) {
      return fail(401, "Unauthorised: invalid or missing admin secret");
    }

    const { id } = await ctx.params;
    if (!/^[a-f\d]{24}$/i.test(id)) {
      return fail(404, "Social post not found");
    }

    const existing = await prisma.socialPost.findUnique({ where: { id } });
    if (!existing) return fail(404, "Social post not found");

    const body = await readJson<{ isVisible: boolean }>(request);
    if (typeof body.isVisible !== "boolean") {
      return fail(422, "isVisible must be a boolean");
    }

    const updated = await prisma.socialPost.update({
      where: { id },
      data: { isVisible: body.isVisible },
    });

    return ok(updated, "Social post visibility updated successfully");
  });
}
