import "server-only";

import { prisma } from "@/lib/db";
import { yearFromRollNumber, schoolFromRollNumber } from "@/lib/academic";
import { ApiError } from "@/lib/api/errors";
import { toSafeUser, type SafeUser } from "@/lib/auth/access";
import {
  hashPassword,
  normalizePasswordForStorage,
  verifyPassword,
} from "@/lib/auth/password";
import {
  createSessionToken,
  setSessionCookie,
  clearSessionCookie,
} from "@/lib/auth/session";
import { issueOtp, verifyOtp } from "@/lib/services/otp";
import { sendMail } from "@/lib/email/mailer";
import { welcomeEmail } from "@/lib/email/templates";
import type {
  ChangePasswordInput,
  LoginInput,
  RegisterInput,
} from "@/lib/services/auth.types";

/**
 * Authentication flows, ported from `controllers/auth/*`.
 *
 * Two security problems in the original are fixed here:
 *
 *  1. `login` ran behind `checkAccess('USER','MEMBER')`, which looked up the
 *     user by the posted email and threw a distinct 404 "User not found" before
 *     any password check. That turns the login form into an account-enumeration
 *     oracle. Both branches now return the same generic message.
 *  2. Password hashing happened in the browser. It happens here now — see
 *     `lib/auth/password.ts` for why this does not invalidate stored hashes.
 */

async function startSession(user: { id: string; email: string }): Promise<string> {
  const token = await createSessionToken({
    id: user.id,
    email: user.email,
    loginTime: new Date().toISOString(),
  });
  await setSessionCookie(token);
  return token;
}

export async function login(
  input: LoginInput,
): Promise<{ user: SafeUser; token: string }> {
  const record = await prisma.user.findUnique({
    where: { email: input.email },
  });

  // Same error for "no such account" and "wrong password" — do not leak which.
  const invalid = new ApiError(401, "Incorrect email or password");
  if (!record) throw invalid;

  const valid = await verifyPassword(input.password, record.password);
  if (!valid) throw invalid;

  const token = await startSession(record);
  return { user: toSafeUser(record), token };
}

/** Step 1 of signup: confirm the address is free, then email a code. */
export async function requestEmailVerification(email: string): Promise<void> {
  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existing) {
    throw new ApiError(
      409,
      "An account already exists for this email. Try signing in, or reset your password.",
    );
  }

  await issueOtp({ email, purpose: "EMAIL_VERIFICATION" });
}

/** Step 2 of signup: check the code, create the account, start a session. */
export async function register(
  input: RegisterInput,
): Promise<{ user: SafeUser; token: string }> {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true },
  });
  if (existing) {
    throw new ApiError(409, "An account already exists for this email");
  }

  // Consume only after the user row is committed, so a failure mid-create does
  // not burn the code and force the user back through the email step.
  await verifyOtp({
    email: input.email,
    code: input.otp,
    purpose: "EMAIL_VERIFICATION",
    consume: false,
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- otp is consumed separately
  const { otp, password, ...profile } = input;

  const record = await prisma.user.create({
    data: {
      ...profile,
      password: await normalizePasswordForStorage(password),
      // Access level is assigned server-side. The old register controller took
      // the whole request body, so a caller could post `access: "ADMIN"`.
      access: "USER",
      editProfileCount: 5,
      regForm: [],
    },
  });

  await verifyOtp({
    email: input.email,
    code: input.otp,
    purpose: "EMAIL_VERIFICATION",
    consume: true,
  }).catch(() => undefined);

  // Best-effort: a welcome email that fails must not fail the signup.
  const welcome = welcomeEmail({ name: record.name ?? "there" });
  void sendMail({ to: record.email, ...welcome });

  const token = await startSession(record);
  return { user: toSafeUser(record), token };
}

export async function requestPasswordReset(email: string): Promise<void> {
  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  // Deliberately silent when the address is unknown: responding differently
  // would confirm whether an account exists.
  if (existing) {
    await issueOtp({ email, purpose: "FORGOT_PASSWORD" });
  }
}

export async function changePassword(input: ChangePasswordInput): Promise<void> {
  const record = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true },
  });
  if (!record) throw new ApiError(400, "That code is not correct");

  await verifyOtp({
    email: input.email,
    code: input.otp,
    purpose: "FORGOT_PASSWORD",
    consume: true,
  });

  await prisma.user.update({
    where: { id: record.id },
    data: { password: await hashPassword(input.password) },
  });
}

export async function logout(): Promise<void> {
  await clearSessionCookie();
}

type GoogleUserInfo = {
  email?: string;
  email_verified?: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  hd?: string;
};

/**
 * A KIIT roll number encodes the intake year and the school, so a
 * @kiit.ac.in sign-up can be pre-filled instead of asking for it again.
 * The derivation itself lives in `lib/academic.ts`, shared with registration
 * and profile edits so all three agree.
 */
function kiitProfileFrom(email: string) {
  const rollNumber = email.split("@")[0] ?? "";

  return {
    college: "Kalinga Institute of Industrial Technology",
    rollNumber,
    year: yearFromRollNumber(rollNumber),
    school: schoolFromRollNumber(rollNumber),
  };
}

/**
 * Google sign-in.
 *
 * Takes the **access token** that `useGoogleLogin`'s implicit flow hands the
 * browser, and exchanges it at Google's UserInfo endpoint — which is what the
 * Express controller does, and what `GoogleLogin.jsx` / `GoogleSignup.jsx` have
 * always posted as `access_token`.
 *
 * An earlier version of this port expected an ID token and called
 * `OAuth2Client.verifyIdToken`. Nothing ever sends one: the components use the
 * implicit flow, whose response carries an opaque access token, so sign-in
 * failed for everyone. Verifying it locally is not an option either — an access
 * token is not a JWT and carries no claims to verify. Handing it back to Google
 * is what establishes who it belongs to.
 */
export async function googleAuth(accessToken: string): Promise<{
  user: SafeUser;
  token: string;
  isNewUser: boolean;
  needsProfile: boolean;
}> {
  let payload: GoogleUserInfo;
  try {
    // Sent as a Bearer header rather than the `?access_token=` query string the
    // original used. Same endpoint and same response, but a credential in a URL
    // ends up in proxy and server logs.
    const response = await fetch(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      // 401 from Google means the token is bad or expired — the caller's
      // problem, not a server fault, so it must not surface as a 500.
      throw new ApiError(
        response.status === 401 || response.status === 403 ? 401 : 502,
        "Could not verify your Google sign-in",
      );
    }

    payload = (await response.json()) as GoogleUserInfo;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    // fetch only rejects on a transport failure.
    throw new ApiError(503, "No response from Google");
  }

  if (!payload?.email) {
    throw new ApiError(401, "Google did not return an email address");
  }
  if (payload.email_verified === false) {
    throw new ApiError(403, "Your Google email address is not verified");
  }

  const email = payload.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    // Backfill the avatar if the account has none, but never overwrite a
    // picture the user uploaded themselves.
    const record =
      !existing.img && payload.picture
        ? await prisma.user.update({
            where: { id: existing.id },
            data: { img: payload.picture },
          })
        : existing;

    const token = await startSession(record);
    return {
      user: toSafeUser(record),
      token,
      isNewUser: false,
      needsProfile: !record.rollNumber || !record.contactNo,
    };
  }

  // Built from the given/family parts first, exactly as the controller does,
  // falling back to the display name when Google sends neither.
  const composed = [payload.given_name, payload.family_name]
    .filter(Boolean)
    .join(" ");
  const name = composed || payload.name || email.split("@")[0];

  // `hd` is the Google Workspace domain, so this only fires for a real
  // @kiit.ac.in account, not for anyone who types the address in.
  const kiit = payload.hd === "kiit.ac.in" ? kiitProfileFrom(email) : null;

  // Google-only accounts have no password. Store an unusable placeholder rather
  // than an empty string so `bcrypt.compare` can never succeed against it.
  const created = await prisma.user.create({
    data: {
      email,
      name,
      img: payload.picture ?? null,
      password: `google-oauth:${crypto.randomUUID()}`,
      access: "USER",
      editProfileCount: 5,
      regForm: [],
      ...(kiit ?? {}),
    },
  });

  const welcome = welcomeEmail({ name: created.name ?? "there" });
  void sendMail({ to: created.email, ...welcome });

  const token = await startSession(created);
  return {
    user: toSafeUser(created),
    token,
    isNewUser: true,
    needsProfile: true,
  };
}
