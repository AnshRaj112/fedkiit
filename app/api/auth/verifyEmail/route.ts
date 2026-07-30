import { prisma } from "@/lib/db";
import { body, expressError, handle, json } from "@/lib/api/express";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/api/rate-limit";
import { issueOtp } from "@/lib/services/otp";

/**
 * POST /api/auth/verifyEmail
 * Port of controllers/auth/verifyEmailController.js — step 1 of signup.
 */
export async function POST(request: Request) {
  return handle(async () => {
    const { email } = await body<{ email?: string }>(request);

    if (!email) return expressError(400, "Email is required");

    const address = email.trim().toLowerCase();

    await enforceRateLimit({ ...RATE_LIMITS.otpRequest, subject: address });

    const existingUser = await prisma.user.findUnique({
      where: { email: address },
      select: { id: true },
    });

    if (existingUser) {
      return expressError(
        400,
        "User already exists with this email. If you have forgot the password try reseting the password using forgot password",
      );
    }

    await issueOtp({ email: address, purpose: "EMAIL_VERIFICATION" });

    return json({ message: "OTP sent successfully" }, 200);
  });
}
