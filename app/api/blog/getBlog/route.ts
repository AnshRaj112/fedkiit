import { prisma } from "@/lib/db";
import { handle, json } from "@/lib/api/express";

/**
 * GET /api/blog/getBlog
 * Port of controllers/blog/getBlogs.js — `{ success, message, blogs }`.
 *
 * Blog.jsx filters on `visibility` itself, so every row is returned exactly as
 * the Express endpoint did.
 */
export async function GET() {
  return handle(async () => {
    const blogs = await prisma.blog.findMany();

    return json({
      success: true,
      message: "All blogs fetched successfully",
      blogs,
    });
  });
}
