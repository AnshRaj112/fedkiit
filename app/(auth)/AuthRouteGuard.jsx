"use client";

import { useContext, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

import AuthContext from "@/src/context/AuthContext";

/**
 * Redirect away from the auth pages once the user is signed in.
 *
 * In the original this lived in the React Router table, not in the components:
 *
 *   <Route path="/Login"  element={authCtx.isLoggedIn ? <LoginRedirect /> : <Login />} />
 *   <Route path="/SignUp" element={authCtx.isLoggedIn ? <LoginRedirect /> : <Signup />} />
 *   <Route path="/otp"    element={authCtx.isLoggedIn ? <Navigate to="/profile" /> : <OTPInput />} />
 *
 * so `Login.jsx` never navigates itself — it calls `authCtx.login(...)` and the
 * route re-renders as a redirect. That mechanism has no equivalent under the App
 * Router (routes are files, and `proxy.ts` only runs on a server request, which
 * a client-side sign-in never makes), so the guard is reinstated here.
 *
 * Without it, a successful login showed "Login successful" and then sat on
 * /Login forever.
 *
 * This only ever has to handle the *transition* into a signed-in state. A
 * signed-in user who opens an auth page directly is redirected by `proxy.ts`
 * before the page is rendered at all.
 */

/** Auth pages that return the user to where they came from. */
const RETURNS_TO_PREV_PAGE = new Set(["/Login", "/SignUp"]);

/** Reject `//evil.com` and absolute URLs — same rule `proxy.ts` applies. */
const isSafeInternalPath = (path) =>
  typeof path === "string" && path.startsWith("/") && !path.startsWith("//");

export default function AuthRouteGuard({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoggedIn, isLoading, logout } = useContext(AuthContext);

  // `isLoading` covers the mount effect that restores a stored session, so we
  // never act before we know whether the visitor is signed in.
  const settled = !isLoading;

  // Whether the session was already in place when this page opened (restored
  // from localStorage) rather than created by signing in on this page.
  const wasRestored = useRef(null);

  useEffect(() => {
    if (!settled) return;

    if (wasRestored.current === null) wasRestored.current = isLoggedIn;
    if (!isLoggedIn) return;

    // Read from `window` rather than `useSearchParams()` on purpose: that hook
    // would opt every auth page out of prerendering unless the layout wrapped
    // them in Suspense, and a layout-level boundary is what made prerendered
    // pages emit their markup twice (see MIGRATION.md).
    const next = new URLSearchParams(window.location.search).get("next");

    // `next` is only ever appended by proxy.ts, and only when it rejected the
    // session cookie. Landing here with a session we did not just create
    // therefore means localStorage is stale — the cookie is gone or expired.
    // Redirecting would bounce straight back off the proxy, so trust the server
    // and drop the client-side session instead.
    if (next && wasRestored.current) {
      void logout();
      return;
    }

    let target = "/profile";

    if (RETURNS_TO_PREV_PAGE.has(pathname)) {
      // Either value is the page the user was actually trying to reach:
      // `next` from the proxy, `prevPage` from the original's ProtectedRoute.
      const prevPage = sessionStorage.getItem("prevPage");

      if (isSafeInternalPath(next)) {
        target = next;
      } else if (isSafeInternalPath(prevPage)) {
        target = prevPage;
      }

      sessionStorage.removeItem("prevPage");
    }

    router.replace(target);
  }, [settled, isLoggedIn, pathname, router, logout]);

  // Children always render. Blanking the page while the redirect is in flight
  // would leave a stale-session visitor staring at nothing: the proxy bounces
  // them back to this same URL without unmounting the layout, so the effect
  // above does not run a second time and nothing would ever restore the form.
  return children;
}
