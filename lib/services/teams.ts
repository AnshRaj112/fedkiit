import "server-only";

import { randomInt } from "node:crypto";

import { prisma } from "@/lib/db";
import { ApiError } from "@/lib/api/errors";
import type { SafeUser } from "@/lib/auth/access";
import type { EventInfo } from "@/lib/types/event";

/**
 * Team management, ported from controllers/registration/*.
 *
 * The model: a `formRegistration` row per registrant, grouped by `teamCode`.
 * Fresh registrations start with a generated `SOLO-…` code and the placeholder
 * team name `UNAFFILIATED`; the operations here move rows between codes.
 *
 * Every mutation re-reads inside a transaction and re-checks membership and
 * capacity, so two people acting on the same team at once cannot both succeed.
 */

export const UNAFFILIATED = "UNAFFILIATED";

function newTeamCode(name: string): string {
  const slug = name.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 8);
  return `${slug || "TEAM"}-${randomInt(1000, 10000)}`;
}

async function loadRegistration(formId: string, userId: string) {
  if (!/^[a-f\d]{24}$/i.test(formId)) {
    throw new ApiError(404, "Form not found");
  }
  const registration = await prisma.formRegistration.findFirst({
    where: { formId, userId },
  });
  if (!registration) {
    throw new ApiError(400, "You are not registered for this event");
  }
  return registration;
}

async function teamLimits(formId: string) {
  const form = await prisma.form.findUnique({
    where: { id: formId },
    select: { info: true },
  });
  const info = (form?.info ?? {}) as EventInfo;
  const max = Number.parseInt(String(info.maxTeamSize ?? ""), 10);
  const min = Number.parseInt(String(info.minTeamSize ?? ""), 10);
  return {
    max: Number.isFinite(max) && max > 0 ? max : 1,
    min: Number.isFinite(min) && min > 0 ? min : 1,
    title: info.eventTitle ?? "the event",
  };
}

/** Creates a named team from the caller's existing solo registration. */
export async function createTeam(input: {
  user: SafeUser;
  formId: string;
  teamName: string;
}) {
  const name = input.teamName.trim().toUpperCase();
  if (!name) throw new ApiError(400, "Team name is required");

  const registration = await loadRegistration(input.formId, input.user.id);

  if (registration.teamName !== UNAFFILIATED) {
    throw new ApiError(400, "You are already in a team");
  }

  const clash = await prisma.formRegistration.findFirst({
    where: { formId: input.formId, teamName: name },
    select: { id: true },
  });
  if (clash) {
    throw new ApiError(
      400,
      "! This team name already taken !\n Please choose a different one.",
    );
  }

  const teamCode = newTeamCode(name);

  await prisma.$transaction([
    prisma.formRegistration.update({
      where: { id: registration.id },
      data: { teamName: name, teamCode, teamSize: 1 },
    }),
    prisma.registrationTracker.update({
      where: { formId: input.formId },
      data: { regTeamNames: { push: name } },
    }),
  ]);

  return { teamName: name, teamCode };
}

/** Joins an existing team by its code. */
export async function joinTeam(input: {
  user: SafeUser;
  formId: string;
  teamCode: string;
}) {
  const code = input.teamCode.trim();
  if (!code) throw new ApiError(400, "Team code is required");

  const registration = await loadRegistration(input.formId, input.user.id);
  if (registration.teamName !== UNAFFILIATED) {
    throw new ApiError(400, "You are already in a team");
  }

  const { max } = await teamLimits(input.formId);

  return prisma.$transaction(async (tx) => {
    const members = await tx.formRegistration.findMany({
      where: { formId: input.formId, teamCode: code },
    });

    if (members.length === 0) throw new ApiError(404, "Invalid team code");
    if (members.length >= max) throw new ApiError(400, "This team is full");

    const teamName = members[0]!.teamName;
    const emails = [
      ...new Set([
        ...members.flatMap((m) => m.regTeamMemEmails),
        input.user.email,
      ]),
    ];

    await tx.formRegistration.update({
      where: { id: registration.id },
      data: { teamCode: code, teamName, regTeamMemEmails: emails },
    });

    // Keep every row in the team consistent about its membership list.
    await tx.formRegistration.updateMany({
      where: { formId: input.formId, teamCode: code },
      data: { regTeamMemEmails: emails, teamSize: emails.length },
    });

    return { teamName, teamCode: code, teamSize: emails.length };
  });
}

/** Leaves the current team, returning to an unaffiliated solo registration. */
export async function leaveTeam(input: { user: SafeUser; formId: string }) {
  const registration = await loadRegistration(input.formId, input.user.id);

  if (registration.teamName === UNAFFILIATED) {
    throw new ApiError(400, "You are not in a team");
  }

  const code = registration.teamCode;

  return prisma.$transaction(async (tx) => {
    const remaining = await tx.formRegistration.findMany({
      where: { formId: input.formId, teamCode: code, id: { not: registration.id } },
    });

    const emails = remaining.flatMap((m) => m.regTeamMemEmails)
      .filter((e) => e !== input.user.email);
    const unique = [...new Set(emails)];

    await tx.formRegistration.update({
      where: { id: registration.id },
      data: {
        teamCode: `SOLO-${input.user.id}-${randomInt(1000, 10000)}`,
        teamName: UNAFFILIATED,
        regTeamMemEmails: [input.user.email],
        teamSize: 1,
      },
    });

    if (remaining.length > 0) {
      await tx.formRegistration.updateMany({
        where: { formId: input.formId, teamCode: code },
        data: { regTeamMemEmails: unique, teamSize: unique.length },
      });
    }

    return { left: true };
  });
}

/** Renames the caller's team. */
export async function renameTeam(input: {
  user: SafeUser;
  formId: string;
  teamName: string;
}) {
  const name = input.teamName.trim().toUpperCase();
  if (!name) throw new ApiError(400, "Team name is required");

  const registration = await loadRegistration(input.formId, input.user.id);
  if (registration.teamName === UNAFFILIATED) {
    throw new ApiError(400, "You are not in a team");
  }

  const clash = await prisma.formRegistration.findFirst({
    where: {
      formId: input.formId,
      teamName: name,
      teamCode: { not: registration.teamCode },
    },
    select: { id: true },
  });
  if (clash) throw new ApiError(400, "That team name is already taken");

  await prisma.formRegistration.updateMany({
    where: { formId: input.formId, teamCode: registration.teamCode },
    data: { teamName: name },
  });

  return { teamName: name };
}

/** Removes a member from the caller's team. Only the team leader may do this. */
export async function removeTeamMember(input: {
  user: SafeUser;
  formId: string;
  email: string;
}) {
  const registration = await loadRegistration(input.formId, input.user.id);
  const target = input.email.trim().toLowerCase();

  if (target === input.user.email) {
    throw new ApiError(400, "Use leave team to remove yourself");
  }

  const members = await prisma.formRegistration.findMany({
    where: { formId: input.formId, teamCode: registration.teamCode },
    orderBy: { id: "asc" },
  });

  // The leader is whoever created the team — the earliest row on the code.
  if (members[0]?.userId !== input.user.id) {
    throw new ApiError(403, "Only the team leader can remove members");
  }

  const targetUser = await prisma.user.findUnique({
    where: { email: target },
    select: { id: true },
  });
  if (!targetUser) throw new ApiError(404, "That member was not found");

  const targetReg = members.find((m) => m.userId === targetUser.id);
  if (!targetReg) throw new ApiError(404, "That member is not in your team");

  const emails = members
    .flatMap((m) => m.regTeamMemEmails)
    .filter((e) => e !== target);
  const unique = [...new Set(emails)];

  await prisma.$transaction([
    prisma.formRegistration.update({
      where: { id: targetReg.id },
      data: {
        teamCode: `SOLO-${targetUser.id}-${randomInt(1000, 10000)}`,
        teamName: UNAFFILIATED,
        regTeamMemEmails: [target],
        teamSize: 1,
      },
    }),
    prisma.formRegistration.updateMany({
      where: { formId: input.formId, teamCode: registration.teamCode },
      data: { regTeamMemEmails: unique, teamSize: unique.length },
    }),
  ]);

  return { removed: target };
}

/** Teams with room left, for the join picker. */
export async function searchTeams(formId: string, query: string) {
  if (!/^[a-f\d]{24}$/i.test(formId)) throw new ApiError(404, "Form not found");

  const { max } = await teamLimits(formId);

  const rows = await prisma.formRegistration.findMany({
    where: {
      formId,
      teamName: { not: UNAFFILIATED },
      ...(query ? { teamName: { contains: query, mode: "insensitive" } } : {}),
    },
    select: { teamName: true, teamCode: true, regTeamMemEmails: true },
  });

  const byCode = new Map<string, { teamName: string; teamCode: string; size: number }>();
  for (const row of rows) {
    const entry = byCode.get(row.teamCode);
    if (entry) entry.size = Math.max(entry.size, row.regTeamMemEmails.length);
    else
      byCode.set(row.teamCode, {
        teamName: row.teamName,
        teamCode: row.teamCode,
        size: row.regTeamMemEmails.length,
      });
  }

  return [...byCode.values()]
    .map((t) => ({ ...t, maxSize: max, isFull: t.size >= max }))
    .filter((t) => !t.isFull);
}
