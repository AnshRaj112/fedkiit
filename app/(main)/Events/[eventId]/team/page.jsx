"use client";

import { Suspense } from "react";

import TeamManagement from "@/src/views/TeamManagement/TeamManagement";
import ProtectedRoute from "@/src/components/ProtectedRoute";
import { Loading } from "@/src/microInteraction";

/**
 * /Events/:eventId/team — team management, behind the auth guard.
 * Suspense is required: TeamManagement and ProtectedRoute read search params.
 */
export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <ProtectedRoute>
        <TeamManagement />
      </ProtectedRoute>
    </Suspense>
  );
}
