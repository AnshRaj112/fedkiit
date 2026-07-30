import { FAQS, SITE, SOCIALS } from "@/lib/site";
import { absoluteUrl, SITE_URL } from "@/lib/seo/metadata";

/**
 * JSON-LD builders.
 *
 * This is the AEO half of the work: answer engines and AI crawlers lean on
 * structured data to decide what a page asserts. Every builder returns a plain
 * object that gets serialised by the `<JsonLd>` component.
 */

type Json = Record<string, unknown>;

export function organizationSchema(): Json {
  return {
    "@context": "https://schema.org",
    "@type": ["Organization", "EducationalOrganization"],
    "@id": `${SITE_URL}/#organization`,
    name: SITE.name,
    legalName: SITE.legalName,
    alternateName: [SITE.shortName, "Federation of Entrepreneurship Development"],
    url: SITE_URL,
    logo: SITE.logo,
    description: SITE.about,
    foundingDate: SITE.founded,
    parentOrganization: { "@type": "Organization", name: SITE.parentOrganization },
    address: {
      "@type": "PostalAddress",
      addressLocality: SITE.address.locality,
      addressRegion: SITE.address.region,
      addressCountry: SITE.address.country,
    },
    sameAs: SOCIALS.map((s) => s.href),
    knowsAbout: [
      "Entrepreneurship",
      "Startup incubation",
      "Business development",
      "Student innovation",
    ],
  };
}

export function websiteSchema(): Json {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: SITE.name,
    description: SITE.description,
    publisher: { "@id": `${SITE_URL}/#organization` },
    inLanguage: "en-IN",
  };
}

export function faqSchema(
  entries: ReadonlyArray<{ question: string; answer: string }> = FAQS,
): Json {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: entries.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  };
}

export function breadcrumbSchema(
  trail: ReadonlyArray<{ name: string; path: string }>,
): Json {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export type EventSchemaInput = {
  id: string;
  name: string;
  description: string;
  startDate?: string | null;
  endDate?: string | null;
  location?: string | null;
  image?: string | null;
  isPaid?: boolean;
  price?: number | string | null;
  registrationUrl?: string | null;
  isPast?: boolean;
};

export function eventSchema(event: EventSchemaInput): Json {
  const url = absoluteUrl(`/events/${event.id}`);
  const isOnline = /online|virtual|zoom|meet/i.test(event.location ?? "");

  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.name,
    description: event.description,
    url,
    ...(event.image ? { image: [event.image] } : {}),
    ...(event.startDate ? { startDate: event.startDate } : {}),
    ...(event.endDate ? { endDate: event.endDate } : {}),
    eventStatus: event.isPast
      ? "https://schema.org/EventScheduled"
      : "https://schema.org/EventScheduled",
    eventAttendanceMode: isOnline
      ? "https://schema.org/OnlineEventAttendanceMode"
      : "https://schema.org/OfflineEventAttendanceMode",
    location: isOnline
      ? { "@type": "VirtualLocation", url }
      : {
          "@type": "Place",
          name: event.location || SITE.address.institution,
          address: {
            "@type": "PostalAddress",
            addressLocality: SITE.address.locality,
            addressRegion: SITE.address.region,
            addressCountry: SITE.address.country,
          },
        },
    organizer: {
      "@type": "Organization",
      name: SITE.name,
      url: SITE_URL,
    },
    ...(event.isPast
      ? {}
      : {
          offers: {
            "@type": "Offer",
            url: event.registrationUrl ?? url,
            price: event.isPaid ? String(event.price ?? "0") : "0",
            priceCurrency: "INR",
            availability: "https://schema.org/InStock",
          },
        }),
  };
}

export type ArticleSchemaInput = {
  title: string;
  description: string;
  url: string;
  image?: string | null;
  date?: string | null;
  authorName?: string | null;
};

export function articleSchema(article: ArticleSchemaInput): Json {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.title,
    description: article.description,
    url: article.url,
    ...(article.image ? { image: [article.image] } : {}),
    ...(article.date ? { datePublished: article.date } : {}),
    author: {
      "@type": article.authorName ? "Person" : "Organization",
      name: article.authorName || SITE.name,
    },
    publisher: { "@id": `${SITE_URL}/#organization` },
  };
}

/** Collection pages (events list, team, blog index) as an ordered ItemList. */
export function itemListSchema(
  name: string,
  items: ReadonlyArray<{ name: string; path: string }>,
): Json {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: absoluteUrl(item.path),
    })),
  };
}
