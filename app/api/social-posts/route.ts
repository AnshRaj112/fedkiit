import { prisma } from "@/lib/db";
import { handleRoute, ok, fail, readJson } from "@/lib/api/respond";
import { deriveEmbedUrl } from "@/lib/utils/embedUrl";
import type { Platform, CreateSocialPostInput } from "@/lib/types/SocialPost";

const VALID_PLATFORMS: Platform[] = ["instagram", "linkedin"];

/**
 * Validates the `x-admin-secret` header against the ADMIN_SECRET env var.
 * Returns true if valid, false otherwise.
 */
function isAuthorised(request: Request): boolean {
  const secret = request.headers.get("x-admin-secret");
  const expected = process.env.ADMIN_SECRET;
  if (!expected || !secret) return false;
  return secret === expected;
}

/**
 * GET /api/social-posts
 * Fetch all social posts. Accepts an optional `?visible=true` query param
 * to return only visible posts (for the public feed).
 */
export async function GET(request: Request) {
  return handleRoute(async () => {
    const { searchParams } = new URL(request.url);
    const visibleOnly = searchParams.get("visible") === "true";

    const where = visibleOnly ? { isVisible: true } : {};

    const posts = await prisma.socialPost.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return ok(posts, "Social posts fetched successfully");
  });
}

/**
 * POST /api/social-posts
 * Create a new social post. Requires `x-admin-secret` header.
 */
export async function POST(request: Request) {
  return handleRoute(async () => {
    if (!isAuthorised(request)) {
      return fail(401, "Unauthorised: invalid or missing admin secret");
    }

    const body = await readJson<CreateSocialPostInput>(request);

    if (!body.platform || !VALID_PLATFORMS.includes(body.platform)) {
      return fail(422, "Platform must be 'instagram' or 'linkedin'");
    }
    if (!body.url || typeof body.url !== "string") {
      return fail(422, "A valid URL is required");
    }

    const embedUrl = deriveEmbedUrl(body.platform, body.url);
    if (!embedUrl) {
      return fail(
        422,
        `Could not derive embed URL for platform "${body.platform}". Check the URL format.`,
      );
    }

    const post = await prisma.socialPost.create({
      data: {
        platform: body.platform,
        url: body.url.trim(),
        embedUrl,
        caption: body.caption?.trim() || null,
        isVisible: body.isVisible ?? true,
      },
    });

    return ok(post, "Social post created successfully");
  });
}
