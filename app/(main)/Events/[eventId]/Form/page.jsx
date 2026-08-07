"use client";

import { Suspense } from "react";

import EventForm from "@/src/views/Event/EventForm";
import ProtectedRoute from "@/src/components/ProtectedRoute";
import { Loading } from "@/src/microInteraction";

/**
 * /Events/:eventId/Form — the registration form, behind the auth guard.
 *
 * The event listing is no longer rendered underneath. It was only there to sit
 * behind the overlay; now that the form is a page it would mean fetching and
 * painting every event just to hide it under an opaque card.
 *
 * Suspense is required: both EventForm and ProtectedRoute read
 * `useSearchParams()`. It is declared per-page rather than in the layout, since
 * a layout-level boundary made every prerendered page emit its markup twice.
 */
export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <ProtectedRoute>
        <EventForm />
      </ProtectedRoute>
    </Suspense>
  );
}
