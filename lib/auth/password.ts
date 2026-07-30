import "server-only";

import bcrypt from "bcryptjs";

import { getEnv } from "@/lib/env";

/**
 * Password hashing.
 *
 * The old stack hashed on the *client* (`bcrypt.hashSync` in SignUP.jsx using
 * VITE_BCRYPT) and stored the result verbatim, while login sent the raw
 * password and the server ran `bcrypt.compare`. The stored value was therefore
 * always a standard bcrypt hash of the plaintext.
 *
 * That means hashing can move server-side — where it belongs — without
 * invalidating a single existing password: the stored format is unchanged, and
 * `verifyPassword` still compares plaintext against it.
 */
export async function hashPassword(plaintext: string): Promise<string> {
  return bcrypt.hash(plaintext, getEnv().BCRYPT_SALT_ROUNDS);
}

export async function verifyPassword(
  plaintext: string,
  hash: string,
): Promise<boolean> {
  if (!plaintext || !hash) return false;
  try {
    return await bcrypt.compare(plaintext, hash);
  } catch {
    // A malformed hash in the database should read as "wrong password", not 500.
    return false;
  }
}

/**
 * Accepts a password that may already be a bcrypt digest.
 *
 * Older clients still in the wild hash before POSTing. Detecting the bcrypt
 * prefix lets those requests through unchanged during the transition instead of
 * double-hashing them into an unusable value.
 */
const BCRYPT_DIGEST = /^\$2[aby]?\$\d{2}\$[./A-Za-z0-9]{53}$/;

export function isBcryptDigest(value: string): boolean {
  return BCRYPT_DIGEST.test(value);
}

export async function normalizePasswordForStorage(
  value: string,
): Promise<string> {
  return isBcryptDigest(value) ? value : hashPassword(value);
}
