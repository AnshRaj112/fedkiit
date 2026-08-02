"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";

import { AuthContextProvider } from "./AuthContext";
import RecoveryContextProvider from "./RecoveryContext";

/**
 * Client provider stack — mirrors the nesting in FED-Frontend/src/index.jsx:
 *
 *   AuthContextProvider > RecoveryContextProvider > GoogleOAuthProvider > App
 *
 * `BrowserRouter` is gone (the App Router replaces it). Vercel's <Analytics />
 * and <SpeedInsights /> are omitted here — they are injected by the hosting
 * platform for Next.js apps rather than mounted as components.
 */
export default function Providers({ children }) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

  return (
    <AuthContextProvider>
      <RecoveryContextProvider>
        <GoogleOAuthProvider clientId={clientId}>
          {children}
        </GoogleOAuthProvider>
      </RecoveryContextProvider>
    </AuthContextProvider>
  );
}
