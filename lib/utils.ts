import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Conditional class names with Tailwind conflict resolution. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Formats an event date for display.
 *
 * Event dates are free-text strings in the database, so this falls back to the
 * raw string when it will not parse rather than rendering "Invalid Date" — which
 * is what the old `moment(info.eventDate).format(...)` calls did.
 */
export function formatEventDate(
  value: string | Date | null,
  fallback = "",
): string {
  if (!value) return fallback;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return typeof value === "string" ? value : fallback;
  }
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(date);
}

/** Short day/month pair for the date badge on event cards. */
export function eventDateBadge(
  value: string | Date | null,
): { day: string; month: string } | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return {
    day: new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      timeZone: "Asia/Kolkata",
    }).format(date),
    month: new Intl.DateTimeFormat("en-IN", {
      month: "short",
      timeZone: "Asia/Kolkata",
    }).format(date),
  };
}

export function formatInr(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Trims text to a word boundary for card summaries and meta descriptions. */
export function truncate(text: string, max: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
