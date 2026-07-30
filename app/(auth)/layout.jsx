import AuthRouteGuard from "./AuthRouteGuard";

/**
 * Auth layout — the `AuthLayout` component from App.jsx.
 * No navbar, no footer, just the `.authpage` wrapper.
 *
 * `AuthRouteGuard` stands in for the `authCtx.isLoggedIn ? <Navigate/> : <Page/>`
 * conditions the original route table applied to all five auth routes.
 *
 * No Suspense boundary here: wrapping children made prerendered pages emit
 * their markup twice (once inside the streamed boundary, once outside). Pages
 * that read search params declare their own boundary.
 */
export default function AuthLayout({ children }) {
  return (
    <div className="authpage">
      <AuthRouteGuard>{children}</AuthRouteGuard>
    </div>
  );
}
