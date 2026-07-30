import type { Metadata } from "next";
import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

export const metadata: Metadata = {
  title: "FED KIIT — Foundation for Entrepreneurship Development",
  description:
    "FED KIIT bridges the gap between engineering and entrepreneurship. A community-driven initiative fostering innovation, mentorship, and building products that scale.",
  keywords: ["FED KIIT", "entrepreneurship", "KIIT University", "startup", "founders", "innovation"],
  openGraph: {
    title: "FED KIIT — Foundation for Entrepreneurship Development",
    description:
      "Empowering the next generation of founders at KIIT University.",
    type: "website",
  },
  icons: {
    icon: "/fedkiit-logo.svg",
    shortcut: "/fedkiit-logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-[#080808] bg-grid-pattern bg-grid-glow text-white font-sans antialiased">
        <Navbar />
        <main className="flex-1 relative z-10">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
