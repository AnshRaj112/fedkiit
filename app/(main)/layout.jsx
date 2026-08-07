"use client";

import { usePathname } from "next/navigation";

// The revamped navbar. Its links point at the canonical capitalised routes
// (/Events, /Team, /Blog), so it drives the existing pages rather than
// replacing them. The previous SCSS navbar is still in the tree, unused.
import Navbar from "@/app/components/Navbar";
import Footer from "@/src/layouts/Footer/Footer";

/**
 * Main site layout — the `MainLayout` component from App.jsx.
 *
 * Same structure: Navbar, a `.page` wrapper that gains `.omega-page` on the
 * Omega route, then Footer.
 *
 * The Chatbot is *not* here. App.jsx renders it above `<Routes>`, so it appears
 * on every route including Login, SignUp and the OTP screens; mounting it in
 * this layout hid it on all of those. It now lives in the root layout.
 *
 * Deliberately no Suspense boundary here. Wrapping `{children}` made every
 * prerendered page ship its content twice — once inside the streamed boundary
 * (`div#S:0`) and once outside — so the Home sections appeared duplicated in the
 * DOM. Only the handful of pages that call `useSearchParams()` need a boundary,
 * and they each declare their own.
 */
export default function MainLayout({ children }) {
  const pathname = usePathname();
  const path = pathname?.toLowerCase() ?? "";
  const isOmegaPage = path === "/omega";

  // The navbar is fixed, so every page has to reserve space for it or its first
  // element renders behind the pill. `.page` used to carry `margin-top: 88px`
  // for exactly this, but globals.css zeroes it with `!important` across body,
  // .page and main — which is what put the headings on /Team, /Alumni and
  // /profile underneath the navbar.
  //
  // Home and Omega opt out: both open with a full-bleed hero that is meant to
  // run up behind a transparent navbar, and an offset there would leave a band
  // of empty page above it.
  const isFullBleed = path === "/" || isOmegaPage;

  return (
    <div>
      <Navbar />
      <div
        className={`page ${isOmegaPage ? "omega-page" : ""} ${
          isFullBleed ? "" : "page--nav-offset"
        }`}
      >
        {children}
      </div>
      <Footer />
    </div>
  );
}
