"use client";

import EventDetail from "@/src/views/Event/EventDetail";

/**
 * /Events/:eventId
 *
 * Was `[<Event />, <EventModal onClosePath="/Events" />]` — the listing stayed
 * mounted and a fixed overlay opened on top of it. It is a page of its own now,
 * so the listing is no longer fetched and painted underneath just to be covered.
 */
export default function Page() {
  return <EventDetail />;
}
