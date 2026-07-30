"use client";

import Event from "@/src/views/Event/Event";
import EventModal from "@/src/features/Modals/Event/EventModal/EventModal";

/**
 * /Events/:eventId
 *
 * App.jsx rendered `[<Event />, <EventModal onClosePath="/Events" />]` — the
 * listing stays mounted underneath and the modal opens over it.
 */
export default function Page() {
  return (
    <>
      <Event />
      <EventModal onClosePath="/Events" />
    </>
  );
}
