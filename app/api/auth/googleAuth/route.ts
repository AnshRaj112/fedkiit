import { body, expressError, handle, json } from "@/lib/api/express";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/api/rate-limit";
import { googleAuth } from "@/lib/services/auth";

/**
 * POST /api/auth/googleAuth
 * Port of controllers/auth/google/googleAuthentication.js.
 *
 * The body is `{ access_token }`. `GoogleLogin.jsx` and `GoogleSignup.jsx` both
 * use `useGoogleLogin`'s implicit flow and post that key — as they did against
 * Express. This route previously looked for `credential` / `token` / `tokenId`
 * and matched none of them, so every Google sign-in was rejected with a 400
 * before Google was ever contacted.
 *
 * `token` and `credential` stay accepted as aliases so a caller that already
 * adopted either keeps working.
 */
export async function POST(request: Request) {
  return handle(async () => {
    const payload = await body<{
      access_token?: string;
      credential?: string;
      token?: string;
      tokenId?: string;
    }>(request);

    const accessToken =
      payload.access_token || payload.token || payload.credential || payload.tokenId;
    if (!accessToken) {
      return expressError(400, "Missing fields: access_token");
    }

    await enforceRateLimit(RATE_LIMITS.login);

    const result = await googleAuth(accessToken);

    // 201 when the account was just created, 200 otherwise; the message is
    // "LOGGED IN" either way, matching the controller. GoogleSignup.jsx keys its
    // toast off the status, not the message.
    return json(
      {
        message: "LOGGED IN",
        user: result.user,
        token: result.token,
        isNewUser: result.isNewUser,
        needsProfile: result.needsProfile,
      },
      result.isNewUser ? 201 : 200,
    );
  });
}
