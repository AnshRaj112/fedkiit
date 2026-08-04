import "server-only";

import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import type { OtpPurpose } from "@prisma/client";

import { prisma } from "@/lib/db";
import { ApiError } from "@/lib/api/errors";
import { sendMail } from "@/lib/email/mailer";
import { otpEmail } from "@/lib/email/templates";
import { getEnv } from "@/lib/env";

/**
 * One-time passcodes for email verification and password reset.
 *
 * Replaces `utils/otp/*` and `utils/email/generateOtpAndSendMail.js`. Behaviour
 * changes worth knowing:
 *
 *  - Codes are stored as a SHA-256 digest instead of plaintext, so a database
 *    dump no longer reveals every live code. Legacy plaintext rows still verify
 *    (see `matches`), so nobody with a pending code is stranded at cutover.
 *  - Expiry is enforced purely by reading `createdAt + age`. The old code also
 *    scheduled a `setTimeout` to delete the row, which never fires reliably on a
 *    serverless host and silently leaked rows.
 *
 * Length stays at 4, matching `generateOtp(4, false, false, false)` in the
 * original. It was briefly raised to 6 on the grounds that 10,000 combinations
 * are brute-forceable — true of the Express backend, which had no throttling at
 * all, but not of this one. `RATE_LIMITS.passwordReset` allows 6 attempts per
 * 15 minutes and a code expires after 15, so an attacker gets at most 6 guesses
 * out of 10,000 before the code they are hunting no longer exists. The extra
 * digits bought very little and cost a great deal: every OTP screen in the app
 * renders exactly four boxes, so a 6-digit code could not be typed in at all.
 *
 * (One caveat on that reasoning: the limiter is in-process, so a horizontally
 * scaled deploy multiplies the effective limit by the instance count. Moving it
 * to a shared store is the follow-up noted in `lib/api/rate-limit.ts`.)
 */

/**
 * Both of these are `OTP_VALIDITY_MINUTES` / `OTP_LENGTH` in the environment,
 * defaulting to the values the Express backend used (15 minutes, 4 digits).
 * Read per call rather than at module load so a deployment can change them
 * without a rebuild — and so `OTPInput` stays in step, since the number of
 * boxes it renders has to match the number of digits sent.
 */
const validityMinutes = () => getEnv().OTP_VALIDITY_MINUTES;

function generateCode(): string {
  const length = getEnv().NEXT_PUBLIC_OTP_LENGTH;
  let code = "";
  for (let i = 0; i < length; i++) code += randomInt(0, 10).toString();
  return code;
}

function digest(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

/** Constant-time comparison that also accepts pre-migration plaintext rows. */
function matches(submitted: string, stored: string): boolean {
  const candidate = /^[a-f0-9]{64}$/i.test(stored) ? digest(submitted) : submitted;
  const a = Buffer.from(candidate);
  const b = Buffer.from(stored);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function isExpired(createdAt: Date, ageMinutes: number): boolean {
  return Date.now() > createdAt.getTime() + ageMinutes * 60_000;
}

/**
 * Issues a code and emails it.
 *
 * `allowRetry: false` makes the row un-reissuable until it expires, which is how
 * the old code throttled resends.
 */
export async function issueOtp(input: {
  email: string;
  purpose: OtpPurpose;
  validityMinutes?: number;
  allowRetry?: boolean;
}): Promise<{ delivered: boolean }> {
  const email = input.email.trim().toLowerCase();
  const validity = input.validityMinutes ?? validityMinutes();
  const allowRetry = input.allowRetry ?? true;

  const existing = await prisma.otp.findUnique({
    where: { email_for: { email, for: input.purpose } },
  });

  if (existing && !existing.allowRetry && !isExpired(existing.createdAt, existing.age)) {
    throw new ApiError(429, "A code was already sent. Please try again shortly.");
  }

  const code = generateCode();
  const purposeKind = input.purpose === "FORGOT_PASSWORD" ? "reset" : "verify";
  const { subject, html } = otpEmail({
    otp: code,
    validityMinutes: validity,
    purpose: purposeKind,
  });

  await prisma.otp.upsert({
    where: { email_for: { email, for: input.purpose } },
    update: {
      otp: digest(code),
      age: validity,
      allowRetry,
      createdAt: new Date(),
      subject,
      template: purposeKind,
    },
    create: {
      email,
      otp: digest(code),
      age: validity,
      allowRetry,
      for: input.purpose,
      subject,
      template: purposeKind,
    },
    select: { id: true },
  });

  const result = await sendMail({ to: email, subject, html });

  if (!result.sent) {
    // The row exists but the code never reached anyone — remove it so the user
    // can immediately request another instead of hitting the retry throttle.
    await prisma.otp
      .delete({ where: { email_for: { email, for: input.purpose } } })
      .catch(() => undefined);
    throw new ApiError(502, "Could not send the verification email. Please try again.");
  }

  return { delivered: true };
}

/**
 * Verifies a submitted code.
 *
 * `consume` deletes the row on success — callers that still need it (register,
 * which creates the user first) can pass `false` and call `consumeOtp` after.
 */
export async function verifyOtp(input: {
  email: string;
  code: string;
  purpose: OtpPurpose;
  consume?: boolean;
}): Promise<void> {
  const email = input.email.trim().toLowerCase();
  const code = input.code.trim();

  if (!code) throw new ApiError(400, "Verification code is required");

  const record = await prisma.otp.findUnique({
    where: { email_for: { email, for: input.purpose } },
  });

  if (!record) {
    throw new ApiError(400, "No verification code was requested for this email");
  }

  if (isExpired(record.createdAt, record.age)) {
    await prisma.otp.delete({ where: { id: record.id } }).catch(() => undefined);
    throw new ApiError(410, "That code has expired. Please request a new one.");
  }

  if (!matches(code, record.otp)) {
    throw new ApiError(400, "That code is not correct");
  }

  if (input.consume !== false) {
    await prisma.otp.delete({ where: { id: record.id } }).catch(() => undefined);
  }
}

export async function consumeOtp(
  email: string,
  purpose: OtpPurpose,
): Promise<void> {
  await prisma.otp
    .delete({
      where: { email_for: { email: email.trim().toLowerCase(), for: purpose } },
    })
    .catch(() => undefined);
}
