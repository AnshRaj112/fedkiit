"use client";

/**
 * Line-art used by the events empty, error and success states.
 *
 * Drawn with `currentColor` at a single stroke weight so the artwork inherits
 * whatever text colour its container sets and stays legible on pure black
 * without needing a fill, a shadow or a second tone.
 */

export const NoEventsArt = (props) => (
  <svg
    viewBox="0 0 120 96"
    role="img"
    aria-label="No events"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect x="18" y="20" width="84" height="62" rx="8" />
    <path d="M18 38h84" />
    <path d="M38 20v-8M82 20v-8" />
    <path d="M34 54h20M34 66h32" opacity="0.45" />
    <circle cx="80" cy="60" r="13" opacity="0.45" />
    <path d="M80 55v5l3 3" opacity="0.45" />
  </svg>
);

export const ErrorArt = (props) => (
  <svg
    viewBox="0 0 120 96"
    role="img"
    aria-label="Something went wrong"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M60 18 104 80H16z" />
    <path d="M60 42v20" />
    <path d="M60 70v.5" />
  </svg>
);

export const SuccessArt = (props) => (
  <svg
    viewBox="0 0 96 96"
    role="img"
    aria-label="Registration complete"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <circle cx="48" cy="48" r="30" />
    <path d="M35 48.5 44 57l17-18" />
    <path d="M48 10v6M48 80v6M10 48h6M80 48h6" opacity="0.35" />
    <path d="m21 21 4 4M71 71l4 4M75 21l-4 4M25 71l-4 4" opacity="0.35" />
  </svg>
);
