/**
 * Single source of truth for site-wide copy, navigation and social links.
 *
 * The old frontend scattered these across Navbar.jsx, Footer.jsx and a handful
 * of JSON files, so the nav and footer drifted out of sync. Both now read from
 * here, and so do the sitemap and the JSON-LD structured data.
 *
 * Safe to import from client components — no secrets, no `server-only`.
 */

export const SITE = {
  name: "FED KIIT",
  legalName: "Federation of Entrepreneurship Development, KIIT",
  shortName: "FED",
  tagline: "Nurturing Using Innovative & Creative strategies",
  description:
    "The Federation of Entrepreneurship Development is the student body of KIIT TBI which aims to bring all ideas and potential startups under one umbrella.",
  /** Longer, self-contained blurb used for AEO answer extraction and JSON-LD. */
  about:
    "FED KIIT (Federation of Entrepreneurship Development) is the student entrepreneurship body of KIIT Technology Business Incubator (KIIT TBI) in Bhubaneswar, India. FED helps student founders validate ideas, runs entrepreneurship events, workshops and competitions, and connects potential startups with mentors and incubation support.",
  locale: "en_IN",
  keywords: [
    "KIIT",
    "FED",
    "FED KIIT",
    "TBI",
    "entrepreneurship",
    "entrepreneur",
    "student society",
    "federation",
    "startup",
    "KIIT TBI",
    "Bhubaneswar",
  ],
  founded: "2015",
  parentOrganization: "KIIT Technology Business Incubator",
  address: {
    locality: "Bhubaneswar",
    region: "Odisha",
    country: "IN",
    institution: "Kalinga Institute of Industrial Technology",
  },
  logo: "https://uploads-ssl.webflow.com/629d87f593841156e4e0d9a4/62eeaa9927e6aea4ff13590e_FedLogo.png",
} as const;

export const SOCIALS = [
  { label: "LinkedIn", href: "https://www.linkedin.com/company/fedkiit/", icon: "linkedin" },
  {
    label: "Instagram",
    href: "https://www.instagram.com/fedkiit?igsh=amNpM3UxMjE1d3Iy",
    icon: "instagram",
  },
  { label: "X", href: "http://twitter.com/federation_kiit", icon: "twitter" },
  { label: "YouTube", href: "https://youtube.com/@federationkiit", icon: "youtube" },
  { label: "Medium", href: "http://medium.com/@fedkiit", icon: "medium" },
] as const;

/** Primary navigation. `external` links open in a new tab. */
export const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Events", href: "/events" },
  { label: "Team", href: "/team" },
  { label: "Blog", href: "/blog" },
  { label: "Social", href: "/social" },
] as const;

export const FOOTER_LINKS = {
  Explore: [
    { label: "Home", href: "/" },
    { label: "Events", href: "/events" },
    { label: "Past Events", href: "/events/past" },
    { label: "Team", href: "/team" },
  ],
  Community: [
    { label: "Contact", href: "/#contact" },
    { label: "Alumni", href: "/alumni" },
    { label: "Blog", href: "/blog" },
    { label: "Social", href: "/social" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "/privacy-policy" },
    { label: "Terms & Conditions", href: "/terms-and-conditions" },
  ],
} as const;

/**
 * Questions the site should be able to answer directly. Rendered as visible
 * copy *and* as FAQPage structured data — answer engines need both.
 */
export const FAQS = [
  {
    question: "What is FED KIIT?",
    answer:
      "FED KIIT — the Federation of Entrepreneurship Development — is the student entrepreneurship body of KIIT Technology Business Incubator (KIIT TBI). It brings student ideas and potential startups under one umbrella, and runs events, workshops and competitions around entrepreneurship.",
  },
  {
    question: "Who can join FED KIIT?",
    answer:
      "Any student of KIIT can join FED. Recruitment happens through an application and interview round announced on the FED website and social channels, typically at the start of the academic year.",
  },
  {
    question: "How do I register for a FED event?",
    answer:
      "Open the Events page, pick the event you want, and use the Register button on its detail page. You will need a FED account; registration takes a minute and paid events are handled through Razorpay checkout.",
  },
  {
    question: "Does FED help students build startups?",
    answer:
      "Yes. FED connects student founders with mentors and with incubation support through KIIT TBI, and runs sessions on idea validation, pitching, funding and go-to-market.",
  },
  {
    question: "Where is FED KIIT located?",
    answer:
      "FED operates out of the KIIT Technology Business Incubator at Kalinga Institute of Industrial Technology in Bhubaneswar, Odisha, India.",
  },
] as const;
