import { prisma } from "@/lib/db";
import { body, expressError, handle, json } from "@/lib/api/express";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/api/rate-limit";
import { hashPassword } from "@/lib/auth/password";
import { verifyOtp } from "@/lib/services/otp";

/**
 * POST /api/auth/changePassword
 * Port of controllers/auth/changePassword.js — completes the reset flow.
 */
export async function POST(request: Request) {
  return handle(async () => {
    const { email, otp, password } = await body<{
      email?: string;
      otp?: string;
      password?: string;
    }>(request);

    if (!email || !otp || !password) {
      return expressError(400, "Email, otp and password are required");
    }

    const address = email.trim().toLowerCase();

    await enforceRateLimit({ ...RATE_LIMITS.passwordReset, subject: address });

    const user = await prisma.user.findUnique({
      where: { email: address },
      select: { id: true },
    });

    // Same message whether or not the account exists.
    if (!user) return expressError(400, "That code is not correct");

    await verifyOtp({
      email: address,
      code: otp,
      purpose: "FORGOT_PASSWORD",
      consume: true,
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { password: await hashPassword(password) },
    });

    return json({ message: "Password changed successfully" }, 200);
  });
}
