"use client";

import { EventStats } from "@/src/features";

/**
 * /profile/events/Analytics/:eventId
 *
 * Renders the event registration analytics sheet for admins / members with
 * access. EventCard and EventsView both deep-link here.
 */
export default function Page() {
  return <EventStats onClosePath="/profile/events" />;
}
