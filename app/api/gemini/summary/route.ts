import { summariseLink } from "@/lib/services/gemini-blog";
import { body, expressError, handle, json } from "@/lib/api/express";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/api/rate-limit";
import { canManageBlogs, getCurrentUser } from "@/lib/auth/access";

/**
 * POST /api/gemini/summary
 * Port of controllers/blog/gemini.js — generates the blog card summary.
 */
export async function POST(request: Request) {
  return handle(async () => {
    const user = await getCurrentUser();
    if (!user) return expressError(401, "Token is required");
    if (!canManageBlogs(user)) return expressError(403, "Unauthorized");

    await enforceRateLimit({ ...RATE_LIMITS.chatbot, subject: user.id });

    const b = await body<{ mediumLink?: string; link?: string }>(request);
    const data = await summariseLink(b.mediumLink ?? b.link ?? "");

    // The form reads result.summary at the top level.
    return json(data);
  });
}
