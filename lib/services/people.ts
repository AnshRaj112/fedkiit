import "server-only";

import { unstable_cache } from "next/cache";
import type { AccessTypes } from "@prisma/client";

import { prisma } from "@/lib/db";

/**
 * Team and alumni directory reads.
 *
 * Replaces `getTeam.js` / `getAlumni.js`. Beyond the framework change: those
 * endpoints selected `email` and returned it to anonymous callers, publishing
 * every office-bearer's address to anyone who hit the API. Email is dropped from
 * the public projection here. They also 404'd on an empty result, which made a
 * legitimately empty roster look like a broken route — this returns `[]`.
 */

export type TeamMember = {
  id: string;
  name: string;
  access: AccessTypes;
  image: string | null;
  blurhash: string | null;
  /** Display title from `extra.title`, falling back to a humanised access level. */
  title: string;
  linkedin: string | null;
  github: string | null;
  instagram: string | null;
  year: string | null;
};

type ExtraBlob = {
  title?: string;
  linkedin?: string;
  github?: string;
  instagram?: string;
  know?: string;
} | null;

/** DIRECTOR_PR_AND_FINANCE -> "Director PR And Finance" */
export function humanizeAccess(access: string): string {
  return access
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Display order for the roster: leadership first, then directors, deputies,
 * senior executives, and finally the functional teams. The old Team page
 * hardcoded this ordering inline in JSX across several sections.
 */
const ACCESS_RANK: Record<string, number> = {
  PRESIDENT: 100,
  VICEPRESIDENT: 95,

  DIRECTOR_TECHNICAL: 80,
  DIRECTOR_CREATIVE: 80,
  DIRECTOR_MARKETING: 80,
  DIRECTOR_OPERATIONS: 80,
  DIRECTOR_PR_AND_FINANCE: 80,
  DIRECTOR_HUMAN_RESOURCE: 80,

  DEPUTY_DIRECTOR_TECHNICAL: 70,
  DEPUTY_DIRECTOR_CREATIVE: 70,
  DEPUTY_DIRECTOR_MARKETING: 70,
  DEPUTY_DIRECTOR_OPERATIONS: 70,
  DEPUTY_DIRECTOR_PR_AND_FINANCE: 70,
  DEPUTY_DIRECTOR_HUMAN_RESOURCE: 70,

  SENIOR_EXECUTIVE_TECHNICAL: 60,
  SENIOR_EXECUTIVE_CREATIVE: 60,
  SENIOR_EXECUTIVE_MARKETING: 60,
  SENIOR_EXECUTIVE_OPERATIONS: 60,
  SENIOR_EXECUTIVE_PR_AND_FINANCE: 60,
  SENIOR_EXECUTIVE_HUMAN_RESOURCE: 60,

  TECHNICAL: 50,
  CREATIVE: 50,
  MARKETING: 50,
  OPERATIONS: 50,
  PR_AND_FINANCE: 50,
  HUMAN_RESOURCE: 50,

  ALUMNI: 20,
  EX_MEMBER: 10,
};

function rank(access: string): number {
  return ACCESS_RANK[access] ?? 0;
}

type Row = {
  id: string;
  name: string | null;
  access: AccessTypes;
  img: string | null;
  blurhash: string | null;
  year: string | null;
  extra: unknown;
};

function toMember(row: Row): TeamMember {
  const extra = (row.extra ?? null) as ExtraBlob;
  return {
    id: row.id,
    name: row.name?.trim() || "FED Member",
    access: row.access,
    image: row.img || null,
    blurhash: row.blurhash || null,
    title: extra?.title?.trim() || humanizeAccess(row.access),
    linkedin: extra?.linkedin?.trim() || null,
    github: extra?.github?.trim() || null,
    instagram: extra?.instagram?.trim() || null,
    year: row.year || null,
  };
}

/** Public projection — no email, no password, no contact numbers. */
const PUBLIC_SELECT = {
  id: true,
  name: true,
  access: true,
  img: true,
  blurhash: true,
  year: true,
  extra: true,
} as const;

async function loadTeam(): Promise<TeamMember[]> {
  const rows = await prisma.user.findMany({
    where: {
      access: { notIn: ["USER", "ADMIN", "ALUMNI", "EX_MEMBER"] },
    },
    select: PUBLIC_SELECT,
  });

  return rows
    .map(toMember)
    .sort(
      (a, b) => rank(b.access) - rank(a.access) || a.name.localeCompare(b.name),
    );
}

async function loadAlumni(): Promise<TeamMember[]> {
  const rows = await prisma.user.findMany({
    where: { access: { in: ["ALUMNI", "EX_MEMBER"] } },
    select: PUBLIC_SELECT,
  });

  return rows.map(toMember).sort((a, b) => a.name.localeCompare(b.name));
}

const cachedTeam = unstable_cache(loadTeam, ["team-roster"], {
  tags: ["people"],
  revalidate: 3600,
});

const cachedAlumni = unstable_cache(loadAlumni, ["alumni-roster"], {
  tags: ["people"],
  revalidate: 3600,
});

/**
 * Roster reads that degrade to an empty list when the database is unreachable,
 * so a Mongo outage cannot fail `next build`. The catch sits outside
 * `unstable_cache`, so a failure is never cached as "no members" — the next
 * request retries the database.
 */
export async function getTeam(): Promise<TeamMember[]> {
  try {
    return await cachedTeam();
  } catch (error) {
    console.error("[people] could not load the team roster", error);
    return [];
  }
}

export async function getAlumni(): Promise<TeamMember[]> {
  try {
    return await cachedAlumni();
  } catch (error) {
    console.error("[people] could not load the alumni roster", error);
    return [];
  }
}

/** Groups the roster into the sections the Team page renders. */
export function groupTeam(members: TeamMember[]) {
  const leadership = members.filter((m) => rank(m.access) >= 95);
  const directors = members.filter(
    (m) => rank(m.access) >= 70 && rank(m.access) < 95,
  );
  const executives = members.filter(
    (m) => rank(m.access) >= 60 && rank(m.access) < 70,
  );
  const teams = members.filter((m) => rank(m.access) < 60);

  return { leadership, directors, executives, teams };
}
