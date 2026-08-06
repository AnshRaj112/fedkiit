import "server-only";

import { getEnv } from "@/lib/env";

/**
 * Year of study.
 *
 * **The user picks it.** A KIIT roll number encodes the intake year
 * (`22052xxx` started in 2022), but intake year does not determine year of
 * study: a lateral-entry student admitted in 2025 joins the 2024 batch directly
 * in 2nd year. Deriving it would put every LE student in the wrong year with no
 * way to correct it, so the dropdown stays and what someone selects is kept.
 *
 * Derivation survives only as a *fallback*, for the one path with no form to
 * fill in — Google sign-up, where the profile is built from the token alone.
 *
 * `normalizeYear` is the part worth keeping regardless. Six spellings of the
 * same thing were in the database ("3rd", "3rd Year", "3rd year", …) because
 * each screen shipped its own option list, and that split one cohort across
 * three buckets in the EventStats year counts.
 */

/** The stored form. Bare ordinals, which is what 115 of 135 rows already used. */
const LABELS = ["1st", "2nd", "3rd", "4th", "5th"] as const;
export const PASSOUT = "Passout";

/**
 * Folds any spelling onto the canonical one: "3rd Year", "3rd year", " 3RD " all
 * become "3rd". Returns `null` for an empty or unrecognisable value so callers
 * can leave the stored value alone rather than overwrite it with rubbish.
 */
export function normalizeYear(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  if (/^passout$/i.test(trimmed)) return PASSOUT;

  // Leading ordinal is the only meaningful part; " Year" is decoration.
  const match = /^([1-5])(?:st|nd|rd|th)?\b/i.exec(trimmed);
  if (match) return LABELS[Number(match[1]) - 1]!;

  return null;
}

/**
 * The academic year turns over in July, not on 1 January — so a 2022 intake is
 * in their 4th year until July 2026, not from January. `ACADEMIC_YEAR_START_MONTH`
 * moves that boundary without a code change.
 */
export function currentAcademicYear(now: Date = new Date()): number {
  const startMonth = getEnv().ACADEMIC_YEAR_START_MONTH;
  return now.getMonth() + 1 >= startMonth ? now.getFullYear() : now.getFullYear() - 1;
}

/**
 * `22052001` -> "4th" (as of the 2025-26 session). Returns `null` when the roll
 * number is not in the expected shape, so callers can leave the field alone
 * rather than storing a wrong guess.
 *
 * A **fallback only** — see the note at the top. It cannot know about lateral
 * entry, so it must never override a year the user selected.
 */
export function yearFromRollNumber(
  rollNumber: string | null | undefined,
  now: Date = new Date(),
): string | null {
  if (!rollNumber) return null;

  const digits = String(rollNumber).trim();
  if (!/^\d{2}/.test(digits)) return null;

  const startYear = Number.parseInt(`20${digits.substring(0, 2)}`, 10);
  if (!Number.isFinite(startYear)) return null;

  const yearOfStudy = currentAcademicYear(now) - startYear + 1;
  // Anything past the 5th year, or a roll number from the future, is not a
  // current student.
  if (yearOfStudy < 1 || yearOfStudy > LABELS.length) return PASSOUT;

  return LABELS[yearOfStudy - 1]!;
}

/** School, from the two digits after the intake year. */
export function schoolFromRollNumber(
  rollNumber: string | null | undefined,
): string | null {
  if (!rollNumber) return null;
  return String(rollNumber).substring(2, 4) === "05"
    ? "Computer Science and Engineering"
    : null;
}
