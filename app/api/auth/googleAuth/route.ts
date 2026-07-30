import { body, expressError, handle, json } from "@/lib/api/express";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/api/rate-limit";
import { googleAuth } from "@/lib/services/auth";

/**
 * POST /api/auth/googleAuth
 * Port of controllers/auth/google/googleAuthentication.js.
 *
 * Accepts either `credential` or `token` — GoogleLogin.jsx and GoogleSignup.jsx
 * each send a different key.
 */
export async function POST(request: Request) {
  return handle(async () => {
    const payload = await body<{
      credential?: string;
      token?: string;
      tokenId?: string;
    }>(request);

    const credential = payload.credential || payload.token || payload.tokenId;
    if (!credential) return expressError(400, "Google credential is required");

    await enforceRateLimit(RATE_LIMITS.login);

    const result = await googleAuth(credential);

    return json({
      message: result.isNewUser ? "User created successfully" : "LOGGED IN",
      user: result.user,
      token: result.token,
      isNewUser: result.isNewUser,
      needsProfile: result.needsProfile,
    });
  });
}
