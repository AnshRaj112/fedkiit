import { prisma } from "@/lib/db";
import { body, expressError, handle, json } from "@/lib/api/express";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/api/rate-limit";
import { issueOtp } from "@/lib/services/otp";

/**
 * POST /api/auth/forgotPassword
 * Port of controllers/auth/forgetPassword.js.
 *
 * SendOtp.jsx branches on a 200, so an unknown address still gets a 200 —
 * which also avoids confirming whether an account exists.
 */
export async function POST(request: Request) {
  return handle(async () => {
    const { email } = await body<{ email?: string }>(request);

    if (!email) return expressError(400, "Email is required");

    const address = email.trim().toLowerCase();

    await enforceRateLimit({ ...RATE_LIMITS.otpRequest, subject: address });

    const user = await prisma.user.findUnique({
      where: { email: address },
      select: { id: true },
    });

    if (user) {
      await issueOtp({ email: address, purpose: "FORGOT_PASSWORD" });
    }

    return json({ message: "OTP sent successfully" }, 200);
  });
}
