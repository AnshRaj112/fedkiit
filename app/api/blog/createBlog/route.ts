import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";
import { expressError, handle, json } from "@/lib/api/express";
import { canManageBlogs, getCurrentUser } from "@/lib/auth/access";
import { uploadImage } from "@/lib/services/upload";

/**
 * POST /api/blog/createBlog
 * Port of controllers/blog/createBlog.js.
 *
 * Access mirrors the Express router: ADMIN or SENIOR_EXECUTIVE_CREATIVE.
 */
export async function POST(request: Request) {
  return handle(async () => {
    const user = await getCurrentUser();
    if (!user) return expressError(401, "Token is required");
    if (!canManageBlogs(user)) return expressError(403, "Unauthorized");

    const form = await request.formData();
    const text = (k: string) => {
      const v = form.get(k);
      return typeof v === "string" ? v : "";
    };

    const title = text("title");
    const desc = text("desc");
    const blogLink = text("blogLink");

    if (!title || !desc || !blogLink) {
      return expressError(400, "Title, description and blog link are required");
    }

    let image = text("image");
    const file = form.get("image");
    if (file instanceof File && file.size > 0) {
      const result = await uploadImage(file, "BlogImages");
      image = result?.secure_url ?? image;
    }

    let author: Prisma.InputJsonValue = { name: user.name ?? "FED KIIT" };
    const rawAuthor = text("author");
    if (rawAuthor) {
      try {
        author = JSON.parse(rawAuthor) as Prisma.InputJsonValue;
      } catch {
        author = { name: rawAuthor };
      }
    }

    const created = await prisma.blog.create({
      data: {
        title,
        desc,
        blogLink,
        image,
        author,
        category: text("category") || null,
        summary: text("summary") || null,
        date: text("date") || new Date().toISOString(),
        visibility: text("visibility") || "public",
      },
    });

    revalidatePath("/Blog");

    return json(
      { success: true, message: "Blog created successfully", blog: created },
      201,
    );
  });
}
