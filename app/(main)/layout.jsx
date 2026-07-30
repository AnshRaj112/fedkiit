"use client";

import { usePathname } from "next/navigation";

import Navbar from "@/src/layouts/Navbar/Navbar";
import Footer from "@/src/layouts/Footer/Footer";
import Chatbot from "@/src/components/Chatbot/Chatbot";

/**
 * Main site layout — the `MainLayout` component from App.jsx.
 *
 * Same structure: Navbar, a `.page` wrapper that gains `.omega-page` on the
 * Omega route, then Footer. The global Chatbot sits alongside it, as it did at
 * the top of `App()`.
 *
 * Deliberately no Suspense boundary here. Wrapping `{children}` made every
 * prerendered page ship its content twice — once inside the streamed boundary
 * (`div#S:0`) and once outside — so the Home sections appeared duplicated in the
 * DOM. Only the handful of pages that call `useSearchParams()` need a boundary,
 * and they each declare their own.
 */
export default function MainLayout({ children }) {
  const pathname = usePathname();
  const isOmegaPage = pathname?.toLowerCase() === "/omega";

  return (
    <div>
      <Chatbot />
      <Navbar />
      <div className={`page ${isOmegaPage ? "omega-page" : ""}`}>
        {children}
      </div>
      <Footer />
    </div>
  );
}
