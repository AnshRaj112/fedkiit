import type { Metadata, Viewport } from "next";
import Script from "next/script";

import Providers from "@/src/context/Providers";
import { JsonLd } from "@/components/seo/JsonLd";
import { SITE } from "@/lib/site";
import { SITE_URL } from "@/lib/seo/metadata";
import { organizationSchema, websiteSchema } from "@/lib/seo/structured-data";

import "./globals.scss";
import "./globals.css";

/**
 * Root layout.
 *
 * Fonts are loaded through the `@import url(...)` rules in globals.scss exactly
 * as the Vite app did, rather than `next/font`. `next/font` self-hosts and
 * subsets the files, which shifts glyph metrics slightly — visible as different
 * line wrapping against the original.
 *
 * Head metadata is expanded from the original index.html (same title,
 * description, keywords and the Facebook domain verification token).
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "FED KIIT",
  description:
    "FED KIIT bridges the gap between engineering and entrepreneurship. A community-driven initiative fostering innovation, mentorship, and building products that scale.",
  keywords: ["FED KIIT", "entrepreneurship", "KIIT University", "startup", "founders", "innovation"],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE.name,
    title: "FED KIIT",
    description:
      "Empowering the next generation of founders at KIIT University.",
    locale: SITE.locale,
  },
  twitter: {
    card: "summary_large_image",
    title: "FED KIIT",
    description: SITE.description,
  },
  icons: {
    icon: [
      { url: "/fedkiit-logo.png", type: "image/png" },
    ],
    shortcut: "/fedkiit-logo.png",
    apple: "/fedkiit-logo.png",
  },
  other: {
    "facebook-domain-verification": "j4kyebnva8sowmo539jn3julvtgvqq",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&family=Open+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,300;1,400;1,500;1,600;1,700;1,800&family=Poppins:wght@300;400;500;600;700;800&family=Manrope:wght@400;500;600;700;800&family=Oswald:wght@400;500;600;700&family=Mulish:wght@400;500;600;700&family=Pixelify+Sans:wght@400;500;600;700&family=Rubik:wght@400;500;600;700&display=swap"
        />
      </head>
      <body>
        <JsonLd schema={[organizationSchema(), websiteSchema()]} />
        <Providers>{children}</Providers>

        {/* Razorpay checkout */}
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="lazyOnload"
        />
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-027MLWYPTL"
          strategy="afterInteractive"
        />
        <Script id="ga-init" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-027MLWYPTL');`}
        </Script>
      </body>
    </html>
  );
}
