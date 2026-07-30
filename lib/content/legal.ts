/**
 * Legal copy, carried over verbatim from `PrivacyPolicy.jsx` and `T&C.jsx`.
 *
 * Kept as data rather than JSX so the page renders it as a real numbered
 * document with proper heading levels. The originals were one long chain of
 * `<p>` tags with `<strong>` clause numbers and inline gradient styles, which
 * gave the pages no outline at all.
 */

export type LegalClause = {
  heading: string;
  points: string[];
};

export type LegalDocument = {
  title: string;
  titleAccent: string;
  intro: string;
  clauses: LegalClause[];
  closing?: string;
  /** Kept in sync manually when the copy changes. */
  lastUpdated: string;
};

export const PRIVACY_POLICY: LegalDocument = {
  title: "Privacy",
  titleAccent: "Policy",
  intro:
    "This Privacy Policy describes how the Federation of Entrepreneurship Development collects, uses, stores and protects the personal information of its members. Please read it carefully to understand our practices regarding your personal data.",
  lastUpdated: "2026-07-30",
  clauses: [
    {
      heading: "Information we collect",
      points: [
        "Personal information: we may collect your name, contact details (email address, phone number) and college ID when you join the Federation of Entrepreneurship Development.",
        "Non-personal information: we may also collect demographic data and preferences to better understand our members and improve our services.",
      ],
    },
    {
      heading: "Collection and use of information",
      points: [
        "We collect personal information to maintain a membership database, communicate with members and organise society activities effectively.",
        "We may use your email address or phone number to send updates, event invitations, newsletters and other society-related communications.",
        "Non-personal information may be used for statistical analysis, research and improving our services.",
      ],
    },
    {
      heading: "Information sharing and disclosure",
      points: [
        "We may share your personal information with trusted third parties who assist us in organising events, managing communications or providing necessary services to the Federation of Entrepreneurship Development. These third parties are bound by confidentiality agreements and are not permitted to use your personal information for any other purpose.",
        "We may disclose your personal information if required to do so by law, or if we believe such disclosure is necessary to protect our rights, comply with legal obligations or safeguard the safety of our members.",
      ],
    },
    {
      heading: "Data security",
      points: [
        "We implement reasonable security measures to protect your personal information from unauthorised access, disclosure, alteration or destruction.",
        "No method of data transmission over the internet or electronic storage is completely secure, so we cannot guarantee the absolute security of your personal information.",
      ],
    },
    {
      heading: "Data retention",
      points: [
        "We retain your personal information only for as long as necessary to fulfil the purposes for which it was collected and to comply with applicable laws and regulations.",
        "If you wish to request the deletion of your personal information from our records, please contact us using the details below.",
      ],
    },
    {
      heading: "Your rights",
      points: [
        "You have the right to access, update and correct your personal information. To exercise these rights, contact us using the details below.",
        "You may unsubscribe from our communications or opt out of certain data collection activities by following the instructions in our communications, or by contacting us.",
      ],
    },
    {
      heading: "Third-party links",
      points: [
        "Our website and communications may contain links to third-party websites or services. We are not responsible for the privacy practices or content of those third parties. We encourage you to review their privacy policies before providing any personal information.",
      ],
    },
    {
      heading: "Changes to this policy",
      points: [
        "We reserve the right to modify or update this Privacy Policy from time to time. Any changes take effect when we post the revised policy, so we encourage you to review it periodically.",
      ],
    },
    {
      heading: "Contact us",
      points: [
        "If you have questions, concerns or requests regarding this Privacy Policy or the handling of your personal information, contact us at fedkiit@gmail.com.",
      ],
    },
  ],
};

export const TERMS_AND_CONDITIONS: LegalDocument = {
  title: "Terms &",
  titleAccent: "Conditions",
  intro:
    "Welcome to the Federation of Entrepreneurship Development at Kalinga Institute of Industrial Technology. We are excited to have you join our community of aspiring entrepreneurs. Please read the following Terms and Conditions carefully — they outline the rules and guidelines governing your participation in the society.",
  lastUpdated: "2026-07-30",
  clauses: [
    {
      heading: "Membership",
      points: [
        "Membership of the Federation of Entrepreneurship Development is open to all currently enrolled students at Kalinga Institute of Industrial Technology.",
        "By becoming a member you agree to abide by these Terms and Conditions and any additional rules or guidelines set out by the society.",
      ],
    },
    {
      heading: "Code of conduct",
      points: [
        "Treat all members, guests and society organisers with respect, kindness and professionalism.",
        "Maintain a supportive and inclusive environment, refraining from any form of discrimination, harassment or bullying.",
        "Avoid engaging in activities that may bring disrepute to the society or the college.",
        "Adhere to ethical business practices, and encourage integrity and honesty among members.",
        "Respect the confidentiality of sensitive information shared within the society.",
      ],
    },
    {
      heading: "Society events and activities",
      points: [
        "Participate actively in society events, workshops, seminars and other activities organised by the society.",
        "Notify the organisers in advance if you are unable to attend an event or activity after registering.",
        "Be punctual and respectful of the schedules and timelines established for events.",
      ],
    },
    {
      heading: "Intellectual property",
      points: [
        "Respect the intellectual property rights of others, including copyrights, trademarks and patents.",
        "Do not use the society platform to share or distribute copyrighted or proprietary material without the necessary permissions.",
      ],
    },
    {
      heading: "Personal liability",
      points: [
        "Participate in society activities at your own risk. The Federation of Entrepreneurship Development and its organisers shall not be held liable for any personal injury, loss, damage or theft that may occur during society events.",
      ],
    },
    {
      heading: "Data privacy",
      points: [
        "The Federation of Entrepreneurship Development collects and stores personal information in accordance with applicable data protection laws.",
        "By joining the society you consent to the collection, storage and processing of your personal information for society-related purposes.",
      ],
    },
    {
      heading: "Amendments and termination",
      points: [
        "The society reserves the right to amend these Terms and Conditions at any time. Any changes will be communicated to members in advance.",
        "The organisers may terminate your membership if you violate these Terms and Conditions or engage in behaviour deemed harmful to the society or its members.",
      ],
    },
    {
      heading: "Governing law",
      points: [
        "These Terms and Conditions are governed by and construed in accordance with the laws of Bhubaneswar, Odisha, India.",
        "Any disputes arising out of or in connection with these Terms and Conditions are subject to the exclusive jurisdiction of the courts in Bhubaneswar, Odisha, India.",
      ],
    },
    {
      heading: "Payments",
      points: [
        "All payments made through this website are refundable by the Federation of Entrepreneurship Development.",
        "The organisation never asks for payment through any channel other than this website.",
      ],
    },
  ],
  closing:
    "By joining the Federation of Entrepreneurship Development at Kalinga Institute of Industrial Technology, you acknowledge that you have read, understood and agreed to these Terms and Conditions. Failure to comply may result in the termination of your membership. If you have any questions or concerns, please contact the society organisers for clarification.",
};
