import { z } from "zod";

/**
 * Request schemas for the auth endpoints.
 *
 * The Express app had an `express-validator` rule set that was wired up for
 * login but commented out for register (`// router.post('/register',
 * registerValidationRules(), ...)`), so registration accepted anything. Every
 * endpoint validates here, and the shared shapes keep the rules consistent.
 *
 * Client-safe: no `server-only` import, so forms can reuse these for
 * pre-submit validation.
 */

export const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required")
  .email("Enter a valid email address")
  .toLowerCase();

/**
 * Password rule.
 *
 * `max(72)` is not arbitrary: bcrypt silently truncates input beyond 72 bytes,
 * so anything longer would create a password whose tail is ignored.
 */
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be at most 72 characters");

export const otpSchema = z
  .string()
  .trim()
  .regex(/^\d{4,6}$/, "Enter the numeric code from your email");

export const loginSchema = z.object({
  email: emailSchema,
  // Not `passwordSchema`: existing accounts predate the length rule, and
  // rejecting their password at login would lock them out of their own account.
  password: z.string().min(1, "Password is required"),
});

export const verifyEmailSchema = z.object({
  email: emailSchema,
});

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().trim().min(2, "Enter your full name").max(80),
  otp: otpSchema,
  rollNumber: z.string().trim().max(30).optional(),
  school: z.string().trim().max(120).optional(),
  college: z.string().trim().max(120).optional(),
  year: z.string().trim().max(20).optional(),
  contactNo: z
    .string()
    .trim()
    .regex(/^[\d+\-\s()]{7,20}$/, "Enter a valid contact number")
    .optional(),
  whatsappNo: z
    .string()
    .trim()
    .regex(/^[\d+\-\s()]{7,20}$/, "Enter a valid WhatsApp number")
    .optional(),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const changePasswordSchema = z.object({
  email: emailSchema,
  otp: otpSchema,
  password: passwordSchema,
});

export const googleAuthSchema = z.object({
  // Google ID token (JWT) from the client-side sign-in flow.
  credential: z.string().min(20, "Missing Google credential"),
});

export const completeProfileSchema = z.object({
  name: z.string().trim().min(2).max(80),
  rollNumber: z.string().trim().max(30).optional(),
  school: z.string().trim().max(120).optional(),
  college: z.string().trim().max(120).optional(),
  year: z.string().trim().max(20).optional(),
  contactNo: z
    .string()
    .trim()
    .regex(/^[\d+\-\s()]{7,20}$/, "Enter a valid contact number")
    .optional(),
  whatsappNo: z
    .string()
    .trim()
    .regex(/^[\d+\-\s()]{7,20}$/, "Enter a valid WhatsApp number")
    .optional(),
});

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(80),
  email: emailSchema,
  message: z
    .string()
    .trim()
    .min(10, "Please write at least a sentence")
    .max(2000, "Message is too long"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ContactInput = z.infer<typeof contactSchema>;
export type CompleteProfileInput = z.infer<typeof completeProfileSchema>;
