import { autofillFromLink } from "@/lib/services/gemini-blog";
import { body, expressError, handle, json } from "@/lib/api/express";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/api/rate-limit";
import { canManageBlogs, getCurrentUser } from "@/lib/auth/access";

/**
 * POST /api/gemini/autofill
 * Port of controllers/blog/gemini.js — reads a post's metadata for the form.
 *
 * Restricted to blog authors. The endpoint fetches an arbitrary user-supplied
 * URL server-side, so leaving it open would make it a general-purpose request
 * proxy; the URL is also validated against private address ranges in the
 * service.
 */
export async function POST(request: Request) {
  return handle(async () => {
    const user = await getCurrentUser();
    if (!user) return expressError(401, "Token is required");
    if (!canManageBlogs(user)) return expressError(403, "Unauthorized");

    await enforceRateLimit({ ...RATE_LIMITS.chatbot, subject: user.id });

    const b = await body<{ mediumLink?: string; link?: string }>(request);
    const data = await autofillFromLink(b.mediumLink ?? b.link ?? "");

    // The form reads result.title / result.author / … at the top level.
    return json(data);
  });
}
