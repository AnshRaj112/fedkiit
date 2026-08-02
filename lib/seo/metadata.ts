import type { Metadata } from "next";

import { SITE } from "@/lib/site";

/**
 * Canonical origin for metadata.
 *
 * Deliberately reads `process.env` directly rather than going through
 * `lib/env.ts`: `generateMetadata` runs in contexts where importing the
 * `server-only` env module would be unnecessary weight, and a bad value here
 * should degrade to the production domain rather than crash the page.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.fedkiit.com"
).replace(/\/$/, "");

export function absoluteUrl(path = "/"): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

type PageMetaInput = {
  title: string;
  description: string;
  path: string;
  /** Absolute or site-relative image URL for OG/Twitter cards. */
  image?: string;
  keywords?: readonly string[];
  type?: "website" | "article";
  publishedTime?: string;
  authors?: readonly string[];
  /** Set for pages that should stay out of search results. */
  noIndex?: boolean;
};

/**
 * Builds per-route metadata with consistent canonicals and social cards.
 *
 * The Vite app shipped one static `<title>` and one `<meta description>` in
 * index.html for all 20+ routes, so every page competed for the same snippet.
 * Each route now declares its own.
 */
export function pageMetadata({
  title,
  description,
  path,
  image,
  keywords,
  type = "website",
  publishedTime,
  authors,
  noIndex = false,
}: PageMetaInput): Metadata {
  const url = absoluteUrl(path);
  const ogImage = image ?? absoluteUrl("/opengraph-image");

  return {
    title,
    description,
    keywords: keywords ? [...keywords] : [...SITE.keywords],
    alternates: { canonical: url },
    robots: noIndex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        },
    openGraph: {
      type,
      url,
      title,
      description,
      siteName: SITE.name,
      locale: SITE.locale,
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
      ...(publishedTime ? { publishedTime } : {}),
      ...(authors ? { authors: [...authors] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}
