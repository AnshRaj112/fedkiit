import "server-only";

import { headers } from "next/headers";

import { ApiError } from "@/lib/api/errors";

/**
 * Fixed-window rate limiter.
 *
 * The Express backend had no throttling at all: `/api/auth/login` and the OTP
 * endpoints would accept unlimited attempts, which makes a 4-digit OTP or a weak
 * password trivially brute-forceable, and lets anyone drain the Resend quota.
 *
 * Scope and limits: this counter lives in the process, so on a multi-instance
 * deploy each instance keeps its own window and the effective limit is
 * `limit x instances`. That is a real weakening but still bounds the attack by
 * orders of magnitude. Moving to a shared store (Redis / Upstash) is the
 * follow-up if the app is scaled horizontally.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/** Bounds memory growth from unique keys; cheap enough to run on every call. */
function sweep(now: number): void {
  if (buckets.size < 5_000) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export type RateLimitOptions = {
  /** Stable identifier for the action, e.g. "login". */
  action: string;
  limit: number;
  windowSeconds: number;
  /** Extra scoping, typically the submitted email. */
  subject?: string;
};

/** Best-effort client IP from the proxy headers a Next.js host sets. */
export async function clientIp(): Promise<string> {
  const headerList = await headers();
  const forwarded = headerList.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return headerList.get("x-real-ip") ?? "unknown";
}

/** Throws a 429 when the caller has exhausted the window. */
export async function enforceRateLimit(
  options: RateLimitOptions,
): Promise<void> {
  const ip = await clientIp();
  const key = `${options.action}:${ip}:${options.subject ?? ""}`;
  const now = Date.now();

  sweep(now);

  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + options.windowSeconds * 1000 });
    return;
  }

  existing.count += 1;

  if (existing.count > options.limit) {
    const seconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
    throw new ApiError(
      429,
      `Too many attempts. Please try again in ${seconds} second${seconds === 1 ? "" : "s"}.`,
    );
  }
}

/** Presets so call sites don't invent their own numbers. */
export const RATE_LIMITS = {
  login: { action: "login", limit: 8, windowSeconds: 300 },
  register: { action: "register", limit: 5, windowSeconds: 600 },
  otpRequest: { action: "otp-request", limit: 4, windowSeconds: 900 },
  passwordReset: { action: "password-reset", limit: 6, windowSeconds: 900 },
  contact: { action: "contact", limit: 3, windowSeconds: 900 },
  chatbot: { action: "chatbot", limit: 20, windowSeconds: 300 },
  registration: { action: "event-registration", limit: 10, windowSeconds: 600 },
} as const;
