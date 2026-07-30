/**
 * Auth layout — the `AuthLayout` component from App.jsx.
 * No navbar, no footer, just the `.authpage` wrapper.
 *
 * No Suspense boundary here: wrapping children made prerendered pages emit
 * their markup twice (once inside the streamed boundary, once outside). Pages
 * that read search params declare their own boundary.
 */
export default function AuthLayout({ children }) {
  return <div className="authpage">{children}</div>;
}
