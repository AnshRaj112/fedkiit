// Route entry — renders the component ported from
// FED-Frontend/src/sections/Profile/Admin/View/VerifyCertificate/VerifyCertificate.jsx
"use client";

import { Suspense } from "react";

import VerifyCertificate from "@/src/sections/Profile/Admin/View/VerifyCertificate/VerifyCertificate";
import { Loading } from "@/src/microInteraction";

/**
 * Suspense is required because VerifyCertificate reads `useSearchParams()`.
 * It is declared per-page rather than in the layout: a layout-level boundary
 * made every prerendered page emit its markup twice.
 */
export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <VerifyCertificate />
    </Suspense>
  );
}
