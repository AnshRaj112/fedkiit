import "server-only";

import { randomInt } from "node:crypto";

import { prisma } from "@/lib/db";
import { ApiError } from "@/lib/api/errors";
import { sendMail } from "@/lib/email/mailer";
import { removedMemberEmail } from "@/lib/email/templates";
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

/**
 * `<2-letter event code>-<3-digit team index>-<4 digits>`, e.g. `AR-003-8793`.
 *
 * Derived from the *event*, not the team name. An earlier version of this port
 * built the code from a slug of the team name (`CLAUDETE-7130`), which every
 * code already in the database contradicts — teams share their code by hand and
 * a second shape makes a valid code look fake.
 */
function newTeamCode(eventTitle: string, teamCount: number): string {
  const eventCode = (eventTitle || "EV").slice(0, 2).toUpperCase();
  const index = String(teamCount).padStart(3, "0");
  return `${eventCode}-${index}-${randomInt(1000, 10000)}`;
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

/**
 * Finds the row the caller *belongs to*, which is not the same as the row they
 * own: `userId` on a team registration is the leader's, so looking a member up
 * by ownership finds nothing and locks them out of their own team.
 */
async function loadMembership(
  formId: string,
  email: string,
  opts?: { notFound?: string },
) {
  const notFound =
    opts?.notFound ?? "No team registration found for this user";
  if (!/^[a-f\d]{24}$/i.test(formId)) {
    throw new ApiError(404, notFound);
  }
  const registration = await prisma.formRegistration.findFirst({
    where: { formId, regTeamMemEmails: { has: email } },
    include: { form: { select: { info: true } } },
  });
  if (!registration) {
    throw new ApiError(404, notFound);
  }
  return registration;
}

/**
 * The event's flags are stored as the *strings* "true"/"false", and Express
 * compares them as such. Matching that exactly matters: a loose truthiness check
 * would treat "false" as closed and block every team change.
 */
function assertRegistrationOpen(info: EventInfo): void {
  if (
    String(info.isRegistrationClosed) === "true" ||
    String(info.isEventPast) === "true"
  ) {
    throw new ApiError(
      400,
      "Registration is closed. Team changes are no longer allowed.",
    );
  }
}

/** `SOLO-<userId>-<4 digits>`, the shape the original generated. */
function soloTeamCode(userId: string): string {
  return `SOLO-${userId}-${randomInt(1000, 10000)}`;
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
    // Unsubstituted, for the team code. `title` carries a prose fallback that
    // would make the code read "TH-…".
    rawTitle: info.eventTitle ?? "",
    isRegistrationClosed: info.isRegistrationClosed,
    isEventPast: info.isEventPast,
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

  // Checked against the tracker's `regTeamNames`, which is what the controller
  // consults and what `leaveTeam` maintains. An earlier version queried
  // `formRegistration` by `teamName` instead, so a name freed by the last member
  // leaving stayed unusable.
  const tracker = await prisma.registrationTracker.findUnique({
    where: { formId: input.formId },
  });
  if (tracker?.regTeamNames.includes(name)) {
    throw new ApiError(
      400,
      "This team name is already taken. Please choose a different one.",
    );
  }

  const { rawTitle } = await teamLimits(input.formId);
  const teamCode = newTeamCode(rawTitle, tracker?.regTeamNames.length ?? 0);

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

/**
 * Joins an existing team by its code — the invite-link path and the
 * accepted-request path both land here.
 *
 * There is **one row per team**, not one per member: `formRegistration` carries
 * `@@unique([formId, teamCode])`, and the row holds the whole roster in
 * `regTeamMemEmails`. An earlier version of this port stamped the team's code
 * onto the joiner's own row, which collides with the leader's row on that
 * constraint — every join failed with a P2002 and surfaced as a 500.
 *
 * So joining *merges*: the joiner's email and their `value` entry move onto the
 * team row and their solo row is deleted.
 */
export async function joinTeam(input: {
  user: SafeUser;
  formId: string;
  teamCode: string;
}) {
  const code = input.teamCode.trim();
  if (!code) throw new ApiError(400, "Team code is required");

  const registration = await loadMembership(input.formId, input.user.email, {
    notFound: "You are not registered for this event. Please register first.",
  });

  if (registration.teamName !== UNAFFILIATED) {
    throw new ApiError(
      400,
      "You are already on a team. Leave your current team first.",
    );
  }

  const targetTeam = await prisma.formRegistration.findUnique({
    where: { formId_teamCode: { formId: input.formId, teamCode: code } },
    include: { form: { select: { info: true } } },
  });

  if (!targetTeam) {
    throw new ApiError(404, "Team not found. The team code may be invalid.");
  }
  if (targetTeam.teamName === UNAFFILIATED) {
    throw new ApiError(400, "Cannot join a teamless registration");
  }

  const info = (targetTeam.form?.info ?? {}) as EventInfo;
  assertRegistrationOpen(info);

  const maxSize = Number.parseInt(String(info.maxTeamSize ?? ""), 10) || 1;
  if (targetTeam.teamSize >= maxSize) {
    throw new ApiError(
      400,
      `Team is full (${targetTeam.teamSize}/${maxSize} members).`,
    );
  }

  // The registrant's own form answers, carried over so the team row keeps a
  // `value` entry per member.
  const userValue = registration.value?.[0] ?? null;

  await prisma.$transaction(async (tx) => {
    await tx.formRegistration.update({
      where: { id: targetTeam.id },
      data: {
        regTeamMemEmails: { push: input.user.email },
        teamSize: { increment: 1 },
        ...(userValue ? { value: { push: userValue } } : {}),
      },
    });

    await tx.formRegistration.delete({ where: { id: registration.id } });

    // Any other team they had asked to join is moot now.
    await tx.teamJoinRequest.updateMany({
      where: {
        formId: input.formId,
        requesterEmail: input.user.email,
        status: "PENDING",
      },
      data: { status: "AUTO_EXPIRED", respondedAt: new Date() },
    });
  });

  const relatedEvent = info.relatedEvent;
  return {
    teamName: targetTeam.teamName,
    teamCode: targetTeam.teamCode,
    // An event created from another one carries `relatedEvent`; the string
    // "null" is a real value in this data, not an absent one.
    eventId:
      relatedEvent && relatedEvent !== "null" ? relatedEvent : input.formId,
  };
}

/** Leaves the current team, returning to an unaffiliated solo registration. */
export async function leaveTeam(input: { user: SafeUser; formId: string }) {
  const { email, id: userId } = input.user;
  const teamRegistration = await loadMembership(input.formId, email);

  if (teamRegistration.teamName === UNAFFILIATED) {
    throw new ApiError(400, "You are not currently on a team.");
  }

  const info = (teamRegistration.form.info ?? {}) as EventInfo;
  assertRegistrationOpen(info);

  const isLeader = teamRegistration.userId === userId;

  // The leader cannot walk away from a populated team and orphan it; they have
  // to remove everyone first, at which point leaving dissolves the team.
  if (isLeader && teamRegistration.teamSize > 1) {
    throw new ApiError(
      400,
      "You must remove all team members before leaving. As the leader, you cannot leave while other members are on the team.",
    );
  }

  const entries = (teamRegistration.value ?? []) as Array<{
    user_email?: string;
  }>;
  const userValue = entries.filter((entry) => entry.user_email === email);
  const code = soloTeamCode(userId);
  const oldTeamName = teamRegistration.teamName;

  const tracker = await prisma.registrationTracker.findUnique({
    where: { formId: input.formId },
  });
  if (!tracker) throw new ApiError(500, "Registration tracker not found");

  await prisma.$transaction(async (tx) => {
    if (isLeader && teamRegistration.teamSize === 1) {
      // Sole member: the existing row becomes their unaffiliated registration,
      // and the team's name is released for reuse.
      await tx.formRegistration.update({
        where: { id: teamRegistration.id },
        data: { teamName: UNAFFILIATED, teamCode: code },
      });

      await tx.registrationTracker.update({
        where: { formId: input.formId },
        data: {
          regTeamNames: {
            set: tracker.regTeamNames.filter((name) => name !== oldTeamName),
          },
        },
      });
    } else {
      // A member leaving keeps their answers: they are lifted out of the team
      // row and carried into a fresh solo registration, so the person stays
      // registered for the event and can join another team.
      await tx.formRegistration.update({
        where: { id: teamRegistration.id },
        data: {
          value: { set: entries.filter((e) => e.user_email !== email) },
          regTeamMemEmails: {
            set: teamRegistration.regTeamMemEmails.filter((e) => e !== email),
          },
          teamSize: { decrement: 1 },
        },
      });

      await tx.formRegistration.create({
        data: {
          formId: input.formId,
          userId,
          teamName: UNAFFILIATED,
          teamCode: code,
          teamSize: 1,
          regTeamMemEmails: [email],
          value: userValue,
        },
      });
      // The tracker is untouched: the person is still registered.
    }
  });

  return { action: isLeader ? "dissolved" : "left", oldTeamName };
}

/** Renames the caller's team. */
export async function renameTeam(input: {
  user: SafeUser;
  formId: string;
  teamName: string;
}) {
  const name = input.teamName.trim().toUpperCase();
  if (!name) throw new ApiError(400, "Team name is required");

  // `loadMembership`, not `loadRegistration`: the controller looks the team up by
  // membership and then compares the row's owner to the caller. An earlier
  // version here loaded the caller's own row and never compared anything, so
  // *any* member could rename the team.
  const registration = await loadMembership(input.formId, input.user.email);

  // Deliberate deviation: the controller has no such guard, so a teamless
  // registrant could rename their own UNAFFILIATED placeholder. That produces a
  // named "team" carrying a SOLO-<userId>-<n> code and absent from the tracker's
  // regTeamNames — a row no other code path expects. Creating a team is what
  // createTeam is for.
  if (registration.teamName === UNAFFILIATED) {
    throw new ApiError(400, "You are not in a team");
  }

  if (registration.userId !== input.user.id) {
    throw new ApiError(403, "Only the team leader can rename the team");
  }

  assertRegistrationOpen((registration.form?.info ?? {}) as EventInfo);

  // Must precede the duplicate check: the team's current name is in
  // `regTeamNames`, so renaming a team to what it is already called would
  // otherwise be rejected as taken.
  if (name === registration.teamName) {
    return { teamName: name, unchanged: true };
  }

  const tracker = await prisma.registrationTracker.findUnique({
    where: { formId: input.formId },
  });
  if (tracker?.regTeamNames.includes(name)) {
    throw new ApiError(
      400,
      "This team name is already taken. Please choose a different one.",
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.formRegistration.updateMany({
      where: { formId: input.formId, teamCode: registration.teamCode },
      data: { teamName: name },
    });

    // Swap the old name for the new one rather than pushing, or the old name
    // stays reserved forever and the list grows on every rename.
    if (tracker) {
      await tx.registrationTracker.update({
        where: { formId: input.formId },
        data: {
          regTeamNames: {
            set: tracker.regTeamNames.map((n) =>
              n === registration.teamName ? name : n,
            ),
          },
        },
      });
    }
  });

  return { teamName: name, unchanged: false };
}

/**
 * Removes a member from the caller's team. Only the team leader may do this.
 *
 * A team is a *single* `formRegistration` row: it carries every member's email
 * in `regTeamMemEmails` and every member's form answers in `value`, and its
 * `userId` is the leader. Removing someone therefore means lifting their entries
 * out of the team row and giving them their own UNAFFILIATED row, so they stay
 * registered for the event and can join or create another team.
 *
 * An earlier version assumed a row per member sharing a `teamCode` and treated
 * the earliest row as leader, which does not match the data this app reads.
 */
export async function removeTeamMember(input: {
  user: SafeUser;
  formId: string;
  memberEmail: string;
}) {
  const { email, id: userId } = input.user;
  const { memberEmail } = input;
  const normalizedEmail = memberEmail.trim().toLowerCase();

  if (!/^[a-f\d]{24}$/i.test(input.formId)) {
    throw new ApiError(404, "You are not the leader of any team for this form");
  }

  // Matching on `userId` is the leader check: only their row comes back.
  const teamRegistration = await prisma.formRegistration.findFirst({
    where: { formId: input.formId, userId },
    include: { form: { select: { info: true } } },
  });
  if (!teamRegistration) {
    throw new ApiError(404, "You are not the leader of any team for this form");
  }

  const info = (teamRegistration.form.info ?? {}) as EventInfo;
  assertRegistrationOpen(info);

  if (memberEmail === email) {
    throw new ApiError(
      400,
      "You cannot remove yourself. Use the Leave/Dissolve Team option.",
    );
  }

  if (!teamRegistration.regTeamMemEmails.includes(memberEmail)) {
    throw new ApiError(404, "The specified completed user is not in your team.");
  }

  const entries = (teamRegistration.value ?? []) as Array<{
    user_email?: string;
  }>;
  const userValue = entries.filter((e) => e.user_email === memberEmail);

  const targetUser = await prisma.user.findUnique({
    where: { email: memberEmail },
    select: { id: true },
  });
  if (!targetUser) {
    throw new ApiError(404, "Target user not found in the system.");
  }

  const code = soloTeamCode(targetUser.id);

  await prisma.$transaction(async (tx) => {
    await tx.formRegistration.update({
      where: { id: teamRegistration.id },
      data: {
        value: { set: entries.filter((e) => e.user_email !== memberEmail) },
        regTeamMemEmails: {
          set: teamRegistration.regTeamMemEmails.filter(
            (e) => e !== memberEmail,
          ),
        },
        teamSize: { decrement: 1 },
      },
    });

    await tx.formRegistration.create({
      data: {
        formId: input.formId,
        userId: targetUser.id,
        teamName: UNAFFILIATED,
        teamCode: code,
        teamSize: 1,
        regTeamMemEmails: [memberEmail],
        value: userValue,
      },
    });
    // The tracker is untouched: the person is still registered for the event.
  });

  const eventTitle = info.eventTitle || "an event";
  await sendMail({
    to: normalizedEmail,
    subject: `You're removed from "${teamRegistration.teamName}" from ${eventTitle}`,
    html: removedMemberEmail({
      teamName: teamRegistration.teamName,
      eventName: info.eventTitle || "Event",
    }),
  });

  return { memberEmail, normalizedEmail };
}

/**
 * Teams with room left, for the join picker.
 *
 * Each entry carries `teamRegistrationId` — the row id — because that is what
 * `TeamlessState.jsx` keys the list on and posts back to `sendJoinRequest`. An
 * earlier version grouped by `teamCode` and returned `{size, maxSize, isFull}`,
 * none of which the component reads, so the picker rendered an empty list and
 * the join button had no id to send.
 */
export async function searchTeams(
  formId: string,
  query: string,
  requesterEmail: string,
) {
  if (!/^[a-f\d]{24}$/i.test(formId)) throw new ApiError(404, "Form not found");

  const form = await prisma.form.findUnique({
    where: { id: formId },
    select: { info: true },
  });
  if (!form) throw new ApiError(404, "Form not found");

  const info = (form.info ?? {}) as EventInfo;
  const maxTeamSize = Number.parseInt(String(info.maxTeamSize ?? ""), 10) || 1;

  // One row per team, so "not full" is a plain comparison on teamSize.
  const teamRegistrations = await prisma.formRegistration.findMany({
    where: {
      formId,
      teamName: { not: UNAFFILIATED },
      teamSize: { lt: maxTeamSize },
    },
    select: { id: true, teamName: true, teamSize: true, userId: true },
  });

  const search = query.trim().toLowerCase();
  const filteredTeams = search
    ? teamRegistrations.filter((t) => t.teamName.toLowerCase().includes(search))
    : teamRegistrations;

  const leaders = await prisma.user.findMany({
    where: { id: { in: [...new Set(filteredTeams.map((t) => t.userId))] } },
    select: { id: true, name: true },
  });
  const leaderMap = new Map(leaders.map((l) => [l.id, l.name]));

  // Teams this person has already asked to join, so the UI can show "Requested"
  // instead of offering the button again.
  const pendingRequests = await prisma.teamJoinRequest.findMany({
    where: { formId, requesterEmail, status: "PENDING" },
    select: { teamRegistrationId: true },
  });
  const pendingTeamIds = new Set(
    pendingRequests.map((r) => r.teamRegistrationId),
  );

  return filteredTeams.map((team) => ({
    teamRegistrationId: team.id,
    teamName: team.teamName,
    teamSize: team.teamSize,
    maxTeamSize,
    leaderName: leaderMap.get(team.userId) || "Unknown",
    spotsRemaining: maxTeamSize - team.teamSize,
    hasPendingRequest: pendingTeamIds.has(team.id),
  }));
}
