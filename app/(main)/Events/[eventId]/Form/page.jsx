"use client";

import { Suspense } from "react";

import Event from "@/src/views/Event/Event";
import EventForm from "@/src/views/Event/EventForm";
import ProtectedRoute from "@/src/components/ProtectedRoute";
import { Loading } from "@/src/microInteraction";

/**
 * /Events/:eventId/Form — the registration form, behind the auth guard.
 *
 * Suspense is required: both EventForm and ProtectedRoute read
 * `useSearchParams()`. It is declared per-page rather than in the layout, since
 * a layout-level boundary made every prerendered page emit its markup twice.
 */
export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <ProtectedRoute>
        <Event />
        <EventForm />
      </ProtectedRoute>
    </Suspense>
  );
}
