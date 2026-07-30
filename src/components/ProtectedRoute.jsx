"use client";

import { useContext, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import AuthContext from "../context/AuthContext";
import { Alert, Loading } from "../microInteraction";

/**
 * Auth guard — ported from the `ProtectedRoute` wrapper in App.jsx.
 *
 * Same behaviour: stash the intended destination, show the "Please log in
 * first" toast, and send the visitor to /Login. The redirect now happens in an
 * effect rather than during render, because calling `router.replace` while
 * rendering is not allowed in the App Router.
 */
const ProtectedRoute = ({ children }) => {
  const authCtx = useContext(AuthContext);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (authCtx.isLoading) return;
    if (authCtx.isLoggedIn) return;

    const query = searchParams?.toString();
    sessionStorage.setItem("prevPage", pathname + (query ? `?${query}` : ""));

    Alert({
      type: "info",
      message: "Please log in first to access this page.",
      position: "bottom-right",
      duration: 3000,
    });

    router.replace("/Login");
  }, [authCtx.isLoading, authCtx.isLoggedIn, pathname, searchParams, router]);

  if (authCtx.isLoading || !authCtx.isLoggedIn) {
    return <Loading />;
  }

  return children;
};

export default ProtectedRoute;
