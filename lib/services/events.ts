import "server-only";

import { unstable_cache } from "next/cache";
import type { form } from "@prisma/client";

import { prisma } from "@/lib/db";
import { ApiError } from "@/lib/api/errors";
import type { EventInfo, FedEvent, FormSection } from "@/lib/types/event";

/**
 * Event/form reads.
 *
 * Replaces `controllers/forms/getForm.js`. Two things change beyond the
 * framework: the `info` JSON is normalised into a typed `FedEvent` at the
 * boundary so pages never touch raw JSON, and public listings are filtered
 * server-side. The old `getAllForms` returned *every* form to *every* caller —
 * including unpublished drafts and the full `sections` array of each form, which
 * leaked the question set of unreleased events.
 */

const CACHE_TAG_EVENTS = "events";

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^\d.-]/g, ""));
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function toDate(value: unknown): Date | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** Collapses a raw `form` row into the normalised shape pages consume. */
export function normalizeEvent(record: Pick<form, "id" | "info">): FedEvent {
  const info = (record.info ?? {}) as EventInfo;

  const amount = toNumber(info.eventAmount, 0);
  const date = toDate(info.eventDate);
  const deadline = toDate(info.regDateAndTime);
  const maxReg = toNumber(info.eventMaxReg, 0);

  // An event is past if it is flagged past, OR if its date has already gone by.
  //
  // The date deliberately wins over an `isEventPast: false` flag. In the live
  // database 35 of 52 events carry `isEventPast: false` alongside a date that
  // has long passed — the flag is set once at creation and rarely updated. The
  // old site trusted the flag alone, so its "upcoming" list filled up with
  // events from previous years. Comparing against the start of today keeps an
  // event that is happening *today* in the upcoming list.
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const isPast =
    info.isEventPast === true ||
    (date !== null && date.getTime() < startOfToday.getTime());

  const closed = info.isRegistrationClosed === true;
  const deadlinePassed = deadline !== null && deadline.getTime() < Date.now();

  const participation =
    (info.participationType ?? "").toLowerCase() === "team" ? "Team" : "Individual";

  return {
    id: record.id,
    title: info.eventTitle?.trim() || "Untitled event",
    description: info.eventdescription?.trim() || "",
    dateLabel: info.eventDate?.trim() || "",
    date,
    registrationDeadline: deadline,
    registrationDeadlineLabel: info.regDateAndTime?.trim() || "",
    image: info.eventImg || null,
    type: info.eventType?.trim() || null,
    isPaid: amount > 0,
    amount,
    maxRegistrations: maxReg > 0 ? maxReg : null,
    participationType: participation,
    minTeamSize: Math.max(1, toNumber(info.minTeamSize, 1)),
    maxTeamSize: Math.max(1, toNumber(info.maxTeamSize, 1)),
    priority: toNumber(info.eventPriority, 0),
    isPublic: info.isPublic !== false,
    isRegistrationClosed: closed,
    isPast,
    relatedEvent: info.relatedEvent?.trim() || null,
    successMessage: info.successMessage?.trim() || null,
    isRegistrationOpen: !isPast && !closed && !deadlinePassed,
  };
}

/** Highest priority first, then soonest date. */
function byPriorityThenDate(a: FedEvent, b: FedEvent): number {
  if (b.priority !== a.priority) return b.priority - a.priority;
  const at = a.date?.getTime() ?? 0;
  const bt = b.date?.getTime() ?? 0;
  return bt - at;
}

/**
 * Cached raw form rows.
 *
 * Only the database read is cached — deliberately *not* the normalised
 * `FedEvent`. Two reasons:
 *
 *  1. `unstable_cache` round-trips its value through JSON, which turns the
 *     `Date` fields on `FedEvent` back into strings. Sorting then blows up on
 *     `date.getTime is not a function`.
 *  2. `isPast` and `isRegistrationOpen` are computed against `Date.now()`.
 *     Caching them would freeze "is this event over?" for the cache lifetime.
 *
 * `sections` is not selected: the question set is only needed on the
 * registration form, and shipping it to every listing both bloats the payload
 * and exposes the questions of unreleased forms.
 */
const getCachedForms = unstable_cache(
  async () => prisma.form.findMany({ select: { id: true, info: true } }),
  ["public-forms"],
  { tags: [CACHE_TAG_EVENTS], revalidate: 300 },
);

/**
 * Reads the cached rows and normalises them, degrading to an empty list if the
 * database is unreachable.
 *
 * The empty fallback keeps `next build` from failing outright when Mongo is down
 * or the build host's IP is not allowlisted. The catch sits *outside*
 * `unstable_cache`: Next does not cache a thrown error, so a failure is never
 * cached as "no events" and the next request retries the database.
 */
async function safePublicEvents(): Promise<FedEvent[]> {
  try {
    const rows = await getCachedForms();
    return rows.map(normalizeEvent).filter((event) => event.isPublic);
  } catch (error) {
    console.error("[events] could not load events from the database", error);
    return [];
  }
}

export async function getUpcomingEvents(): Promise<FedEvent[]> {
  const events = await safePublicEvents();
  return events.filter((event) => !event.isPast).sort(byPriorityThenDate);
}

export async function getPastEvents(): Promise<FedEvent[]> {
  const events = await safePublicEvents();
  return events.filter((event) => event.isPast).sort(byPriorityThenDate);
}

export async function getAllPublicEvents(): Promise<FedEvent[]> {
  const events = await safePublicEvents();
  return [...events].sort(byPriorityThenDate);
}

/** Featured events for the home page, highest priority first. */
export async function getFeaturedEvents(limit = 3): Promise<FedEvent[]> {
  const upcoming = await getUpcomingEvents();
  if (upcoming.length >= limit) return upcoming.slice(0, limit);
  // Pad with recent past events so the home page never renders an empty rail.
  const past = await getPastEvents();
  return [...upcoming, ...past].slice(0, limit);
}

/** Single event by id. Returns null when missing or not public. */
export async function getEventById(id: string): Promise<FedEvent | null> {
  // Mongo ObjectIds are 24 hex chars; anything else would make Prisma throw
  // rather than simply miss.
  if (!/^[a-f\d]{24}$/i.test(id)) return null;

  const record = await prisma.form.findUnique({
    where: { id },
    select: { id: true, info: true },
  });
  if (!record) return null;

  const event = normalizeEvent(record);
  return event.isPublic ? event : null;
}

/** Event plus its form sections, for the registration page. */
export async function getEventWithSections(
  id: string,
): Promise<{ event: FedEvent; sections: FormSection[] } | null> {
  if (!/^[a-f\d]{24}$/i.test(id)) return null;

  const record = await prisma.form.findUnique({
    where: { id },
    select: { id: true, info: true, sections: true },
  });
  if (!record) return null;

  const event = normalizeEvent(record);
  if (!event.isPublic) return null;

  return { event, sections: (record.sections ?? []) as FormSection[] };
}

/** Ids for the sitemap and static params. */
export async function getEventIds(): Promise<string[]> {
  const events = await safePublicEvents();
  return events.map((event) => event.id);
}

/** How many teams/individuals have registered for a form. */
export async function getRegistrationCount(formId: string): Promise<number> {
  if (!/^[a-f\d]{24}$/i.test(formId)) return 0;
  return prisma.formRegistration.count({ where: { formId } });
}

/**
 * Registration counts for many forms in one round trip.
 *
 * The old admin dashboard issued one count query per event, so a page with 30
 * events fired 30 sequential queries.
 */
export async function getRegistrationCounts(
  formIds: string[],
): Promise<Record<string, number>> {
  const valid = formIds.filter((id) => /^[a-f\d]{24}$/i.test(id));
  if (valid.length === 0) return {};

  const grouped = await prisma.formRegistration.groupBy({
    by: ["formId"],
    where: { formId: { in: valid } },
    _count: { _all: true },
  });

  const counts: Record<string, number> = {};
  for (const row of grouped) counts[row.formId] = row._count._all;
  return counts;
}

/** Asserts an event exists and is registerable, or throws the right status. */
export async function assertRegisterable(id: string): Promise<FedEvent> {
  const event = await getEventById(id);
  if (!event) throw new ApiError(404, "Event not found");
  if (event.isPast) throw new ApiError(409, "This event has already finished");
  if (!event.isRegistrationOpen) {
    throw new ApiError(409, "Registration for this event is closed");
  }
  return event;
}

export { CACHE_TAG_EVENTS };
