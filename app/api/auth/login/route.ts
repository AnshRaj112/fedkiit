import { prisma } from "@/lib/db";
import { body, expressError, handle, json } from "@/lib/api/express";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/api/rate-limit";
import { toSafeUser } from "@/lib/auth/access";
import { verifyPassword } from "@/lib/auth/password";
import { createSessionToken, setSessionCookie } from "@/lib/auth/session";

/**
 * POST /api/auth/login
 * Port of controllers/auth/loginController.js.
 *
 * Response is `{ message, user, token }` at the top level — Login.jsx reads
 * `response.data.user` and `response.data.token` directly.
 *
 * One deliberate change: the Express route ran `checkAccess` first, which
 * returned a distinct 404 "User not found" before any password check and turned
 * the login form into an account-enumeration oracle. Both failure modes now
 * return the same 401.
 */
export async function POST(request: Request) {
  return handle(async () => {
    const { email, password } = await body<{
      email?: string;
      password?: string;
    }>(request);

    if (!email || !password) {
      return expressError(400, "Email and password are required");
    }

    await enforceRateLimit({
      ...RATE_LIMITS.login,
      subject: email.toLowerCase(),
    });

    const record = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!record || !(await verifyPassword(password, record.password))) {
      return expressError(401, "Invalid password");
    }

    const token = await createSessionToken({
      id: record.id,
      email: record.email,
      loginTime: new Date().toISOString(),
    });
    await setSessionCookie(token);

    return json({
      message: "LOGGED IN",
      user: toSafeUser(record),
      token,
    });
  });
}
