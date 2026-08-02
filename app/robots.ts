import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/seo/metadata";

/**
 * robots.txt.
 *
 * AI and answer-engine crawlers (GPTBot, ClaudeBot, PerplexityBot, and Google's
 * Extended agent) are explicitly allowed: being quotable by them is the point of
 * the AEO work. Private and authenticated areas are disallowed for everyone.
 */
export default function robots(): MetadataRoute.Robots {
  const disallow = [
    "/api/",
    "/profile",
    "/profile/",
    "/login",
    "/signup",
    "/forgot-password",
    "/complete-profile",
  ];

  return {
    rules: [
      { userAgent: "*", allow: "/", disallow },
      // Named explicitly so a future blanket rule cannot accidentally exclude them.
      { userAgent: "GPTBot", allow: "/", disallow },
      { userAgent: "ClaudeBot", allow: "/", disallow },
      { userAgent: "PerplexityBot", allow: "/", disallow },
      { userAgent: "Google-Extended", allow: "/", disallow },
      { userAgent: "Applebot-Extended", allow: "/", disallow },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
