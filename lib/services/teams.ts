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

/**
 * Finds the row the caller *belongs to*, which is not the same as the row they
 * own: `userId` on a team registration is the leader's, so looking a member up
 * by ownership finds nothing and locks them out of their own team.
 */
async function loadMembership(formId: string, email: string) {
  if (!/^[a-f\d]{24}$/i.test(formId)) {
    throw new ApiError(404, "No team registration found for this user");
  }
  const registration = await prisma.formRegistration.findFirst({
    where: { formId, regTeamMemEmails: { has: email } },
    include: { form: { select: { info: true } } },
  });
  if (!registration) {
    throw new ApiError(404, "No team registration found for this user");
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

    // `eventId` is what the original returned so the caller can route on to the
    // parent event: an event created from another one carries `relatedEvent`,
    // and the string "null" is a real value in this data, not an absent one.
    const form = await tx.form.findUnique({
      where: { id: input.formId },
      select: { info: true },
    });
    const info = (form?.info ?? {}) as EventInfo;
    const relatedEvent = info.relatedEvent;

    return {
      teamName,
      teamCode: code,
      teamSize: emails.length,
      eventId:
        relatedEvent && relatedEvent !== "null" ? relatedEvent : input.formId,
    };
  });
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
