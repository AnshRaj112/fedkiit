export type EventStatus = "live" | "upcoming" | "past";

export interface Speaker {
  name: string;
  title: string;
  initials: string;
}

export interface AgendaItem {
  time: string;
  activity: string;
}

export interface FedEvent {
  id: string;
  tag: string;
  title: string;
  description: string;
  date: string;
  venue: string;
  status: EventStatus;
  prizePool?: string;
  teamSize?: string;
  agenda: AgendaItem[];
  speakers: Speaker[];
  imageAlt: string;
}

export const events: FedEvent[] = [
  {
    id: "pixel-blitz-hack",
    tag: "Hackathon",
    title: "Pixel Blitz Hack",
    description:
      "A 48-hour design and code blitz where creators build interfaces that break the internet. Push boundaries, ship fast, and win big.",
    date: "Aug 14 – 16, 2025",
    venue: "KIIT Campus, Bhubaneswar",
    status: "live",
    prizePool: "₹2,00,000",
    teamSize: "2 – 4 members",
    agenda: [
      { time: "Day 1 – 6:00 PM", activity: "Opening Ceremony & Problem Statement Reveal" },
      { time: "Day 1 – 8:00 PM", activity: "Hacking Begins" },
      { time: "Day 2 – 12:00 PM", activity: "Mid-check Mentoring Sessions" },
      { time: "Day 2 – 6:00 PM", activity: "Workshop: Rapid UI Prototyping" },
      { time: "Day 3 – 10:00 AM", activity: "Final Submissions" },
      { time: "Day 3 – 2:00 PM", activity: "Demo Day & Prize Ceremony" },
    ],
    speakers: [
      { name: "Aryan Mehta", title: "Design Lead, Zerodha", initials: "AM" },
      { name: "Shreya Rao", title: "CTO, Palette (YC W24)", initials: "SR" },
      { name: "Karan Anand", title: "Product @ Razorpay", initials: "KA" },
    ],
    imageAlt: "Pixel Blitz Hackathon Event",
  },
  {
    id: "founders-videocast",
    tag: "Fireside",
    title: "Founder's Videocast",
    description:
      "A live videocast with founders on failing, funding and finding product-market fit. Real stories, no filter.",
    date: "Aug 24, 2025",
    venue: "Online – Zoom",
    status: "upcoming",
    prizePool: undefined,
    teamSize: "Individual",
    agenda: [
      { time: "6:00 PM", activity: "Welcome & Introduction" },
      { time: "6:15 PM", activity: "Founder Stories Panel" },
      { time: "7:00 PM", activity: "Open Q&A Session" },
      { time: "7:30 PM", activity: "Networking Breakout Rooms" },
    ],
    speakers: [
      { name: "Rohan Gupta", title: "CEO, Wispr Labs", initials: "RG" },
      { name: "Priya Mehta", title: "Co-founder, NexaFlow", initials: "PM" },
    ],
    imageAlt: "Founder's Videocast Event",
  },
  {
    id: "e-summit-2025",
    tag: "Summit",
    title: "E-Summit 2025",
    description:
      "Three days of speakers, pitching, workshops and startup expo. The biggest entrepreneurship event of the year at KIIT.",
    date: "Sep 19 – 21, 2025",
    venue: "KIIT Auditorium, Bhubaneswar",
    status: "upcoming",
    prizePool: "₹5,00,000",
    teamSize: "1 – 5 members",
    agenda: [
      { time: "Day 1 – 9:00 AM", activity: "Inaugural Ceremony & Keynote" },
      { time: "Day 1 – 2:00 PM", activity: "Startup Pitching Round 1" },
      { time: "Day 2 – 10:00 AM", activity: "Workshop Sessions & Panels" },
      { time: "Day 2 – 4:00 PM", activity: "Startup Expo Opens" },
      { time: "Day 3 – 11:00 AM", activity: "Final Pitching & Investor Meet" },
      { time: "Day 3 – 4:00 PM", activity: "Awards Ceremony & Closing" },
    ],
    speakers: [
      { name: "Aditi Kapoor", title: "Founder, Palette (YC W24)", initials: "AK" },
      { name: "Suresh Nair", title: "Partner, Blume Ventures", initials: "SN" },
      { name: "Divya Singh", title: "Ex-PM, Google", initials: "DS" },
    ],
    imageAlt: "E-Summit 2025 Event",
  },
  {
    id: "design-sprint-bootcamp",
    tag: "Workshop",
    title: "Design Sprint Bootcamp",
    description:
      "A hands-on design sprint workshop covering user research, prototyping, and validation in 5 intensive days.",
    date: "Jul 5 – 9, 2025",
    venue: "KIIT Campus, Lab 4B",
    status: "past",
    prizePool: undefined,
    teamSize: "Individual",
    agenda: [
      { time: "Day 1", activity: "User Research & Problem Framing" },
      { time: "Day 2", activity: "Ideation & Sketching" },
      { time: "Day 3", activity: "Rapid Prototyping" },
      { time: "Day 4", activity: "User Testing" },
      { time: "Day 5", activity: "Pitch & Feedback" },
    ],
    speakers: [
      { name: "Nisha Patel", title: "UX Lead, Figma", initials: "NP" },
    ],
    imageAlt: "Design Sprint Bootcamp",
  },
  {
    id: "venture-lab-2025",
    tag: "Competition",
    title: "Venture Lab 2025",
    description:
      "FED's flagship startup competition where student-founders pitch their MVPs to a panel of investors and industry experts.",
    date: "Jun 14, 2025",
    venue: "KIIT Business School",
    status: "past",
    prizePool: "₹1,50,000",
    teamSize: "2 – 3 members",
    agenda: [
      { time: "9:00 AM", activity: "Team Check-in & Briefing" },
      { time: "10:00 AM", activity: "Pitch Presentations (Round 1)" },
      { time: "1:00 PM", activity: "Lunch & Networking" },
      { time: "2:00 PM", activity: "Final Pitches to Investors" },
      { time: "4:30 PM", activity: "Awards & Closing" },
    ],
    speakers: [
      { name: "Arjun Shah", title: "CTO, BuildStack", initials: "AS" },
      { name: "Meera Rao", title: "Angel Investor", initials: "MR" },
    ],
    imageAlt: "Venture Lab 2025",
  },
  {
    id: "ai-builders-meetup",
    tag: "Meetup",
    title: "AI Builders Meetup",
    description:
      "An informal gathering of builders exploring AI tools, LLMs, and how to build the next generation of AI-native products.",
    date: "May 22, 2025",
    venue: "Online – Discord Stage",
    status: "past",
    prizePool: undefined,
    teamSize: "Individual",
    agenda: [
      { time: "7:00 PM", activity: "Intro & Icebreakers" },
      { time: "7:15 PM", activity: "Lightning Talks (3 speakers × 10 min)" },
      { time: "8:00 PM", activity: "Open Discussion & Q&A" },
    ],
    speakers: [
      { name: "Dev Trivedi", title: "ML Engineer, Anthropic", initials: "DT" },
    ],
    imageAlt: "AI Builders Meetup",
  },
];

export function getEventById(id: string): FedEvent | undefined {
  return events.find((e) => e.id === id);
}

export function getStatusColor(status: EventStatus): string {
  switch (status) {
    case "live":     return "#22c55e";
    case "upcoming": return "#f97316";
    case "past":     return "#6b7280";
  }
}

export function getStatusGlow(status: EventStatus): string {
  switch (status) {
    case "live":     return "0 0 0 2px rgba(34,197,94,0.3), 0 0 32px rgba(34,197,94,0.2)";
    case "upcoming": return "0 0 0 1px rgba(249,115,22,0.2)";
    case "past":     return "none";
  }
}
