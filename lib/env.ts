import "server-only";

import { z } from "zod";

/**
 * Server-side environment contract.
 *
 * The Express backend read `process.env` ad hoc and failed at request time when
 * something was missing. Here the whole surface is declared once and validated
 * on first access, so a misconfigured deploy fails loudly at boot instead of
 * throwing a 500 halfway through a checkout.
 */
const schema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters"),
  SESSION_SECRET: z.string().optional(),
  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(4).max(15).default(10),

  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  RESEND_API_KEY_2: z.string().optional(),
  EMAIL_FROM_2: z.string().optional(),

  CLOUDINARY_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_SECRET_KEY: z.string().optional(),

  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),

  GEMINI_MODEL: z.string().default("gemini-2.0-flash"),
  CHATBOT_NAME: z.string().default("FEDI"),

  CERT_ORG: z.string().optional(),

  NEXT_PUBLIC_SITE_URL: z.string().url().default("https://www.fedkiit.com"),
  DEBUG: z
    .string()
    .optional()
    .transform((v) => v === "true"),
});

type Env = z.infer<typeof schema> & { GEMINI_API_KEYS: string[] };

let cached: Env | null = null;

export function getEnv(): Env {
  if (cached) return cached;

  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }

  // The backend rotated through GEMINI_API_KEY_1..10 to dodge per-key rate
  // limits. Collect whichever are present, in order.
  const geminiKeys: string[] = [];
  for (let i = 1; i <= 10; i++) {
    const key = process.env[`GEMINI_API_KEY_${i}`];
    if (key) geminiKeys.push(key);
  }

  cached = { ...parsed.data, GEMINI_API_KEYS: geminiKeys };
  return cached;
}

/** Canonical origin, no trailing slash — used for metadata, sitemap and email links. */
export function siteUrl(): string {
  return getEnv().NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
}
