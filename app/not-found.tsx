import Navbar from "@/app/components/Navbar";
import Footer from "@/src/layouts/Footer/Footer";
import ErrorPage from "@/src/views/Error/Error";

/**
 * 404 — renders the original Error page inside the main chrome, matching the
 * App.jsx catch-all route (`<Route path="*" element={<Error />} />`) which sat
 * inside MainLayout.
 */
export default function NotFound() {
  return (
    <div>
      <Navbar />
      <div className="page">
        <ErrorPage />
      </div>
      <Footer />
    </div>
  );
}
