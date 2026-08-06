import { prisma } from "@/lib/db";
import { expressError, handle, json } from "@/lib/api/express";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/api/rate-limit";
import { getCurrentUser } from "@/lib/auth/access";
import { uploadImage } from "@/lib/services/upload";

/** Upload size cap. The avatar's pixel bounds live in `lib/config/images.ts`. */
const MAX_BYTES = 5 * 1024 * 1024;

/**
 * POST /api/user/editProfileImage
 * Port of controllers/image/editProfileImage.js.
 *
 * Always updates the *session's* user. The original took the target email from
 * the request body, so any authenticated caller could overwrite another
 * member's avatar.
 *
 * Returns `{ url }` — EditImage.jsx reads `response.data.url`.
 */
export async function POST(request: Request) {
  return handle(async () => {
    const user = await getCurrentUser();
    if (!user) return expressError(401, "Token is required");

    await enforceRateLimit({ ...RATE_LIMITS.registration, subject: user.id });

    const form = await request.formData().catch(() => null);
    if (!form) return expressError(400, "An image file is required");

    const file = form.get("image");
    if (!(file instanceof File) || file.size === 0) {
      return expressError(400, "An image file is required");
    }

    if (file.size > MAX_BYTES) {
      return expressError(413, "That image is larger than 5 MB");
    }
    if (!file.type.startsWith("image/")) {
      return expressError(415, "That file is not an image");
    }

    const result = await uploadImage(file, "ProfileImages");
    if (!result) {
      return expressError(502, "Could not upload the image. Please try again.");
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { img: result.secure_url },
    });

    return json({
      success: true,
      message: "Profile image updated",
      url: result.secure_url,
    });
  });
}
