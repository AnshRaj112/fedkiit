import "server-only";

import { cache } from "react";
import { headers } from "next/headers";
import type { AccessTypes, user } from "@prisma/client";

import { prisma } from "@/lib/db";
import { ApiError } from "@/lib/api/errors";
import {
  bearerFromHeader,
  getSession,
  verifySessionToken,
} from "@/lib/auth/session";

/** The user record minus the password digest. Never leak the hash. */
export type SafeUser = Omit<user, "password">;

export function toSafeUser(record: user): SafeUser {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- destructured to drop the hash
  const { password, ...rest } = record;
  return rest;
}

/**
 * Resolves the signed-in user for the current request, or null.
 *
 * Replaces the Express `verifyToken` middleware. Wrapped in React's `cache` so
 * that a layout, a page and three server components in the same render share
 * one database read instead of four.
 */
export const getCurrentUser = cache(async (): Promise<SafeUser | null> => {
  let session = await getSession();

  // Fall back to the Authorization header for callers that send the JWT there.
  if (!session) {
    const headerList = await headers();
    const token = bearerFromHeader(headerList.get("authorization"));
    if (token) session = await verifySessionToken(token);
  }

  if (!session?.email) return null;

  const record = await prisma.user.findUnique({
    where: { email: session.email },
  });

  return record ? toSafeUser(record) : null;
});

/** Like `getCurrentUser`, but throws a 401 instead of returning null. */
export async function requireUser(): Promise<SafeUser> {
  const user = await getCurrentUser();
  if (!user) throw new ApiError(401, "You must be signed in to do that");
  return user;
}

/**
 * `MEMBER` is not a real `AccessTypes` value — the Express `checkAccess`
 * middleware treated it as "any access level other than USER". Preserved here
 * so route-level checks read the same as they did before.
 */
export type AccessRequirement = AccessTypes | "MEMBER";

export function hasAccess(
  user: Pick<SafeUser, "access">,
  ...required: AccessRequirement[]
): boolean {
  if (user.access === "ADMIN") return true;
  return required.some((requirement) =>
    requirement === "MEMBER" ? user.access !== "USER" : user.access === requirement,
  );
}

/** Asserts the signed-in user holds at least one of `required`. */
export async function requireAccess(
  ...required: AccessRequirement[]
): Promise<SafeUser> {
  const user = await requireUser();
  if (!hasAccess(user, ...required)) {
    throw new ApiError(403, "You do not have permission to do that");
  }
  return user;
}

/** Anyone who is not a plain USER counts as club staff. */
export function isMember(user: Pick<SafeUser, "access">): boolean {
  return user.access !== "USER";
}

export function isAdmin(user: Pick<SafeUser, "access">): boolean {
  return user.access === "ADMIN";
}

/** Access levels that may publish blog posts, per the old App.jsx route guard. */
export function canManageBlogs(user: Pick<SafeUser, "access">): boolean {
  return user.access === "ADMIN" || user.access === "SENIOR_EXECUTIVE_CREATIVE";
}
