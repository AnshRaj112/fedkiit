import { prisma } from "@/lib/db";
import { body, expressError, handle, json } from "@/lib/api/express";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/api/rate-limit";
import { toSafeUser } from "@/lib/auth/access";
import { normalizePasswordForStorage } from "@/lib/auth/password";
import { createSessionToken, setSessionCookie } from "@/lib/auth/session";
import { consumeOtp, verifyOtp } from "@/lib/services/otp";
import { sendMail } from "@/lib/email/mailer";
import { welcomeEmail } from "@/lib/email/templates";
import { normalizeYear } from "@/lib/academic";

/**
 * POST /api/auth/register
 * Port of controllers/auth/registerController.js — step 2 of signup.
 *
 * Returns `{ message, user, token }` to match what SignUP.jsx reads.
 *
 * Deliberate change: the original spread the entire request body into
 * `prisma.user.create`, so a caller could post `access: "ADMIN"` and promote
 * themselves. Only known profile fields are copied here and `access` is forced
 * to USER, exactly as the original *intended*.
 */
export async function POST(request: Request) {
  return handle(async () => {
    const data = await body<Record<string, string>>(request);
    const { email, password, name, otp } = data;

    if (!email || !password || !name || !otp) {
      return expressError(
        400,
        "Missing required fields: email, password, name, otp",
      );
    }

    const address = email.trim().toLowerCase();

    await enforceRateLimit({ ...RATE_LIMITS.register, subject: address });

    const existingUser = await prisma.user.findUnique({
      where: { email: address },
      select: { id: true },
    });

    if (existingUser) {
      return expressError(400, "User already registerd with this email!!");
    }

    await verifyOtp({
      email: address,
      code: otp,
      purpose: "EMAIL_VERIFICATION",
      consume: false,
    });

    const newUser = await prisma.user.create({
      data: {
        email: address,
        name,
        password: await normalizePasswordForStorage(password),
        rollNumber: data.rollNumber || null,
        school: data.school || null,
        college: data.college || null,
        // Exactly what the user selected — never inferred. Anyone can sign up
        // with a personal address, so the roll number beside this field is not
        // guaranteed to be a KIIT one, and guessing from it would quietly stamp
        // a wrong year on the account. Lateral entry breaks the inference even
        // when the roll number *is* real: a 2025 LE student sits in 2nd year
        // with the 2024 batch.
        //
        // `normalizeYear` only folds spelling ("3rd Year" -> "3rd"); it never
        // invents a value.
        year: normalizeYear(data.year),
        contactNo: data.contactNo || null,
        whatsappNo: data.whatsappNo || null,
        img: data.img || null,
        access: "USER",
        editProfileCount: 5,
        regForm: [],
      },
    });

    await consumeOtp(address, "EMAIL_VERIFICATION");

    const token = await createSessionToken({
      id: newUser.id,
      email: newUser.email,
      loginTime: new Date().toISOString(),
    });
    await setSessionCookie(token);

    // Best effort — a mail failure must not fail an account that now exists.
    const welcome = welcomeEmail({ name: newUser.name ?? "there" });
    void sendMail({ to: newUser.email, ...welcome });

    return json(
      {
        message: "User created successfully",
        user: toSafeUser(newUser),
        token,
      },
      201,
    );
  });
}
