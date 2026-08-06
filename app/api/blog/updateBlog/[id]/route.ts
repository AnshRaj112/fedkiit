import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";
import { expressError, handle, json } from "@/lib/api/express";
import { canManageBlogs, getCurrentUser } from "@/lib/auth/access";
import { uploadImage } from "@/lib/services/upload";

/**
 * PUT /api/blog/updateBlog/:id
 * Port of controllers/blog/updateBlog.js.
 *
 * Only fields actually submitted are changed, so a partial edit cannot blank
 * out the rest of the post.
 */
export async function PUT(
  request: Request,
  ctx: RouteContext<"/api/blog/updateBlog/[id]">,
) {
  return handle(async () => {
    const user = await getCurrentUser();
    if (!user) return expressError(401, "Token is required");
    if (!canManageBlogs(user)) return expressError(403, "Unauthorized");

    const { id } = await ctx.params;
    if (!/^[a-f\d]{24}$/i.test(id)) return expressError(404, "Blog not found");

    const existing = await prisma.blog.findUnique({ where: { id } });
    if (!existing) return expressError(404, "Blog not found");

    const form = await request.formData();
    const text = (k: string) => {
      const v = form.get(k);
      return typeof v === "string" && v !== "" ? v : undefined;
    };

    const data: Prisma.blogUpdateInput = {};

    for (const key of [
      "title",
      "desc",
      "blogLink",
      "category",
      "summary",
      "date",
      "visibility",
    ] as const) {
      const value = text(key);
      if (value !== undefined) data[key] = value;
    }

    const rawAuthor = text("author");
    if (rawAuthor) {
      try {
        data.author = JSON.parse(rawAuthor) as Prisma.InputJsonValue;
      } catch {
        data.author = { name: rawAuthor };
      }
    }

    const file = form.get("image");
    if (file instanceof File && file.size > 0) {
      const result = await uploadImage(file, "BlogImages");
      if (result) data.image = result.secure_url;
    } else {
      const imageUrl = text("image");
      if (imageUrl) data.image = imageUrl;
    }

    const updated = await prisma.blog.update({ where: { id }, data });
    revalidatePath("/Blog");

    return json({
      success: true,
      message: "Blog updated successfully",
      blog: updated,
    });
  });
}
