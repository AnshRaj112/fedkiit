import { prisma } from "@/lib/db";
import { body, expressError, handle, json } from "@/lib/api/express";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/api/rate-limit";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { verifyOtp } from "@/lib/services/otp";

/**
 * POST /api/auth/changePassword
 * Port of controllers/auth/changePassword.js — completes the reset flow.
 *
 * Body is `{ newPassword, confirmPassword, otp, email }`, which is what
 * `OtpInput.jsx` posts. An earlier version of this route read `password`
 * instead of `newPassword`, so a correct code was rejected with
 * "Email, otp and password are required" before it was ever checked.
 *
 * Public, as in Express: the route's `checkAccess('USER','MEMBER','ADMIN')` runs
 * with no `verifyToken` ahead of it, so the middleware takes its `email` from
 * the body and looks the account up itself. Knowing the address is the entry
 * requirement; the OTP is what actually authorises the change.
 */
export async function POST(request: Request) {
  return handle(async () => {
    const { newPassword, confirmPassword, otp, email } = await body<{
      newPassword?: string;
      confirmPassword?: string;
      otp?: string;
      email?: string;
    }>(request);

    if (!newPassword || !confirmPassword || !otp || !email) {
      return expressError(400, "Missing fields.");
    }

    if (newPassword !== confirmPassword) {
      return expressError(
        409,
        "Conflict : New Password and confirm Password did not match!!",
      );
    }

    const address = email.trim().toLowerCase();

    await enforceRateLimit({ ...RATE_LIMITS.passwordReset, subject: address });

    // `checkAccess` answered 404 here when the address was unknown.
    const user = await prisma.user.findUnique({
      where: { email: address },
      select: { id: true, password: true },
    });
    if (!user) return expressError(404, "User not found!");

    await verifyOtp({
      email: address,
      code: otp,
      purpose: "FORGOT_PASSWORD",
      consume: true,
    });

    if (await verifyPassword(newPassword, user.password)) {
      return expressError(
        400,
        "New password cannot be same as the old password ! Instead try login",
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { password: await hashPassword(newPassword) },
    });

    return json({
      status: "OK",
      message: "Password has been changed successfully !!",
    });
  });
}
