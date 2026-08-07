/**
 * Shape of the `form.info` JSON blob.
 *
 * In this data model an "event" is a `form` row whose `info` column holds the
 * event's presentation fields. The blob is untyped JSON in Mongo, so every field
 * is optional here and normalised through `lib/services/events.ts` — the old
 * frontend read `info.eventTitle` directly and blew up on older rows that
 * predated a field.
 *
 * Field names (including the lowercase `d` in `eventdescription`) match what
 * `addForm.js` wrote. They are not renamed, because existing documents use them.
 */
export type EventInfo = {
  eventTitle?: string;
  eventdescription?: string;
  eventDate?: string;
  eventType?: string;
  eventAmount?: string | number;
  eventMaxReg?: string | number;
  eventImg?: string | null;
  relatedEvent?: string;
  participationType?: string;
  maxTeamSize?: string | number;
  minTeamSize?: string | number;
  regDateAndTime?: string;
  eventPriority?: string | number;
  successMessage?: string;
  isPublic?: boolean;
  isRegistrationClosed?: boolean;
  isEventPast?: boolean;
  ongoingEvent?: boolean;
  receiverDetails?: {
    upi?: string | null;
    media?: string | null;
    /**
     * How the participant is asked to pay. Absent on every event created before
     * this setting existed, and those all stored UPI/QR — so a missing `mode`
     * has to be read as "QR" everywhere, never as "unset".
     */
    mode?: "QR" | "Link" | null;
    /** External payment page, used only when `mode` is "Link". */
    link?: string | null;
    /** Label for the button that opens `link`. */
    buttonText?: string | null;
    /** Optional copy rendered under that button. */
    message?: string | null;
  };
};

/** Normalised event, safe to render. Every consumer uses this, not raw `info`. */
export type FedEvent = {
  id: string;
  title: string;
  description: string;
  /** Raw date string as authored, e.g. "2025-08-21" or "21 August 2025". */
  dateLabel: string;
  /** Parsed date, or null when the stored string is unparseable. */
  date: Date | null;
  registrationDeadline: Date | null;
  registrationDeadlineLabel: string;
  image: string | null;
  type: string | null;
  isPaid: boolean;
  amount: number;
  maxRegistrations: number | null;
  participationType: "Team" | "Individual";
  minTeamSize: number;
  maxTeamSize: number;
  priority: number;
  isPublic: boolean;
  isRegistrationClosed: boolean;
  isPast: boolean;
  relatedEvent: string | null;
  successMessage: string | null;
  /** True when registration is genuinely open right now. */
  isRegistrationOpen: boolean;
};

/** A single field inside a form section. */
export type FormFieldDef = {
  name?: string;
  type?: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
  options?: string[];
  value?: unknown;
  [key: string]: unknown;
};

export type FormSection = {
  name?: string;
  fields?: FormFieldDef[];
  [key: string]: unknown;
};
