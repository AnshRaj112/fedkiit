import "server-only";

import { headers } from "next/headers";

import { prisma } from "@/lib/db";
import { ApiError } from "@/lib/api/errors";
import type { SafeUser } from "@/lib/auth/access";
import { sendMail } from "@/lib/email/mailer";
import { envList, getEnv, siteUrl } from "@/lib/env";
import type { EventInfo } from "@/lib/types/event";
import { UNAFFILIATED } from "@/lib/services/teams";

/**
 * Team invitations and join requests.
 *
 * Ports controllers/registration/{inviteTeamMember,getTeamInviteLink,
 * sendJoinRequest,checkJoinRequestUpdates,checkAllJoinRequestUpdates,
 * respondJoinRequest}.js.
 *
 * A join request lives in `teamJoinRequest` and moves
 * PENDING -> ACCEPTED | REJECTED | EXPIRED. The leader responds from an email
 * link, and the requester sees the outcome once via `seenByRequester`.
 */

const REQUEST_TTL_HOURS = 48;

/** Truthy for boolean true and the string "true" the admin UI sometimes wrote. */
const isTrue = (v: unknown) => v === true || v === "true";

/** The caller's registration for a form, with the parent form's info. */
async function myRegistration(formId: string, user: SafeUser) {
  if (!/^[a-f\d]{24}$/i.test(formId)) throw new ApiError(404, "Form not found");

  const registration = await prisma.formRegistration.findFirst({
    where: { formId, regTeamMemEmails: { has: user.email } },
    include: { form: { select: { id: true, info: true } } },
  });

  if (!registration) throw new ApiError(404, "No team registration found");
  return registration;
}

function assertOpen(info: EventInfo) {
  if (isTrue(info.isRegistrationClosed) || isTrue(info.isEventPast)) {
    throw new ApiError(
      400,
      "Registration is closed. Invitations are no longer allowed.",
    );
  }
}

/**
 * Is this a request origin we are willing to put inside a link?
 *
 * `Origin` and `Host` are set by the caller, and the URLs built from them go
 * into **email** — the team invitation, and the accept/reject buttons sent to a
 * team leader. Reflecting them unchecked lets anyone who can create a team have
 * FED KIIT send a message, from its own address, containing a link to a domain
 * they chose. The Express controller did exactly that
 * (`req.headers.origin || process.env.FRONTEND_URL || "https://fedkiit.com"`);
 * this is the one place the port deliberately does not follow it.
 *
 * Localhost stays allowed so a developer copying an invite link gets a link
 * that works on their machine.
 */
function trustedHosts(): Set<string> {
  return new Set([
    // The canonical site is always trusted and never needs listing.
    new URL(siteUrl()).host,
    "localhost",
    "127.0.0.1",
    // Staging, preview deployments and any future domain, added in the
    // environment rather than in this file.
    ...envList(getEnv().TRUSTED_ORIGIN_HOSTS),
  ]);
}

function isTrustedOrigin(candidate: string): boolean {
  try {
    const { host, hostname } = new URL(candidate);
    const trusted = trustedHosts();
    // `host` carries the port, `hostname` does not — checking both means an
    // entry can pin a port ("localhost:3111") or allow any ("localhost").
    return trusted.has(host) || trusted.has(hostname);
  } catch {
    return false;
  }
}

/** Origin of the current request, falling back to the configured site URL. */
async function originUrl(): Promise<string> {
  try {
    const h = await headers();

    const origin = h.get("origin");
    if (origin && isTrustedOrigin(origin)) return origin.replace(/\/$/, "");

    const host = h.get("host");
    if (host) {
      const proto = h.get("x-forwarded-proto") ?? "https";
      const candidate = `${proto}://${host}`;
      if (isTrustedOrigin(candidate)) return candidate;
    }
  } catch {
    // headers() is unavailable outside a request scope.
  }
  return siteUrl();
}

/** GET /api/form/inviteLink/:formId — leader only. */
export async function getTeamInviteLink(formId: string, user: SafeUser) {
  const registration = await myRegistration(formId, user);

  if (registration.userId !== user.id) {
    throw new ApiError(403, "Only the team leader can generate invite links");
  }

  const info = (registration.form.info ?? {}) as EventInfo;
  const base = await originUrl();
  const inviteLink = `${base}/Events/${registration.form.id}/Form?teamCode=${registration.teamCode}`;

  const shareText =
    `Join my team "${registration.teamName}" for ${info.eventTitle || "an event"}!\n\n` +
    `Team Code: ${registration.teamCode}\nJoin here: ${inviteLink}`;

  return {
    inviteLink,
    teamCode: registration.teamCode,
    teamName: registration.teamName,
    shareText,
  };
}

/** POST /api/form/inviteTeamMember — emails an invite. Leader only. */
export async function inviteTeamMember(input: {
  user: SafeUser;
  formId: string;
  inviteeEmail: string;
}) {
  const invitee = input.inviteeEmail.trim().toLowerCase();
  if (!invitee) throw new ApiError(400, "Form ID and invitee email are required");
  if (invitee === input.user.email) {
    throw new ApiError(400, "You cannot invite yourself");
  }

  const registration = await myRegistration(input.formId, input.user);
  if (registration.userId !== input.user.id) {
    throw new ApiError(403, "Only the team leader can invite members");
  }

  const info = (registration.form.info ?? {}) as EventInfo;
  assertOpen(info);

  if (registration.regTeamMemEmails.includes(invitee)) {
    throw new ApiError(400, "That person is already in your team");
  }

  const max = Number.parseInt(String(info.maxTeamSize ?? ""), 10);
  if (Number.isFinite(max) && max > 0 && registration.regTeamMemEmails.length >= max) {
    throw new ApiError(400, "This team is full");
  }

  const base = await originUrl();
  const inviteLink = `${base}/Events/${registration.form.id}/Form?teamCode=${registration.teamCode}`;
  const eventTitle = info.eventTitle || "an event";

  const result = await sendMail({
    to: invitee,
    subject: `${input.user.name ?? "A teammate"} invited you to join "${registration.teamName}"`,
    html: `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f4f4f5;font-family:'Open Sans',Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:16px;overflow:hidden;">
<tr><td style="background:#1c1c1c;background-image:linear-gradient(260deg,#ffbe0b -29.7%,#f42b03 128.34%);padding:28px 32px;">
<p style="margin:0;font-family:Poppins,Arial,sans-serif;font-size:22px;font-weight:700;color:#fff;">FED KIIT</p>
</td></tr>
<tr><td style="padding:32px;">
<h1 style="margin:0 0 16px;font-size:20px;color:#1c1c1c;">You've been invited to a team</h1>
<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#3f3f46;">
${escapeHtml(input.user.name ?? "A teammate")} has invited you to join
<strong>${escapeHtml(registration.teamName)}</strong> for <strong>${escapeHtml(eventTitle)}</strong>.
</p>
<p style="margin:0 0 14px;font-size:15px;color:#3f3f46;">Team code: <strong style="font-family:monospace;">${escapeHtml(registration.teamCode)}</strong></p>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;"><tr>
<td style="border-radius:8px;background:#ff8a00;">
<a href="${inviteLink}" style="display:inline-block;padding:13px 26px;font-size:15px;font-weight:600;color:#1c1c1c;text-decoration:none;">Join the team</a>
</td></tr></table>
<p style="margin:0;font-size:13px;color:#6b7280;">You'll need a FED KIIT account and a registration for this event to join.</p>
</td></tr></table></td></tr></table></body></html>`,
  });

  if (!result.sent) {
    throw new ApiError(502, "Could not send the invitation email. Please try again.");
  }

  return { invited: invitee, teamCode: registration.teamCode, inviteLink };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** POST /api/form/sendJoinRequest — asks a team's leader for admission. */
/**
 * Identifies the target team by the **registration row id**, not a team code —
 * `teamRegistrationId` is what `searchTeams` hands the UI and what
 * `TeamlessState.jsx` posts back. This took a `teamCode` at first, which the UI
 * never sends, so every join request failed with "Team code is required".
 */
export async function sendJoinRequest(input: {
  user: SafeUser;
  formId: string;
  teamRegistrationId: string;
}) {
  const targetId = input.teamRegistrationId.trim();
  if (!targetId) {
    throw new ApiError(400, "Form ID and team registration ID are required");
  }

  const mine = await prisma.formRegistration.findFirst({
    where: { formId: input.formId, userId: input.user.id },
  });
  if (!mine) throw new ApiError(400, "You are not registered for this event");
  if (mine.teamName !== UNAFFILIATED) {
    throw new ApiError(400, "You are already on a team.");
  }

  const team = await prisma.formRegistration.findUnique({
    where: { id: targetId },
    include: { form: { select: { info: true } } },
  });
  if (!team) throw new ApiError(404, "Team not found");
  // A row id is global, so the form has to be checked explicitly.
  if (team.formId !== input.formId) {
    throw new ApiError(400, "Team does not belong to this form");
  }
  if (team.teamName === UNAFFILIATED) {
    throw new ApiError(400, "Cannot request to join a teamless registration");
  }

  const info = (team.form.info ?? {}) as EventInfo;
  assertOpen(info);

  const max = Number.parseInt(String(info.maxTeamSize ?? ""), 10);
  if (Number.isFinite(max) && max > 0 && team.regTeamMemEmails.length >= max) {
    throw new ApiError(400, "This team is full");
  }

  const existing = await prisma.teamJoinRequest.findFirst({
    where: {
      formId: input.formId,
      requesterEmail: input.user.email,
      status: "PENDING",
    },
  });
  if (existing) {
    throw new ApiError(400, "You already have a pending request for this event");
  }

  const leader = await prisma.user.findUnique({
    where: { id: team.userId },
    select: { email: true },
  });

  const expiresAt = new Date(Date.now() + REQUEST_TTL_HOURS * 3600_000);

  const request = await prisma.teamJoinRequest.create({
    data: {
      formId: input.formId,
      requesterEmail: input.user.email,
      requesterName: input.user.name ?? input.user.email,
      teamRegistrationId: team.id,
      teamName: team.teamName,
      // Pinned so acceptance can tell a rename from a disband-and-recreate.
      teamCode: team.teamCode,
      leaderEmail: leader?.email ?? "",
      status: "PENDING",
      seenByRequester: false,
      expiresAt,
    },
  });

  // Notify the leader with accept/reject links that work without signing in.
  if (leader?.email) {
    const base = await originUrl();
    const accept = `${base}/api/form/respondJoinRequest?id=${request.id}&action=accept`;
    const reject = `${base}/api/form/respondJoinRequest?id=${request.id}&action=reject`;

    void sendMail({
      to: leader.email,
      subject: `${input.user.name ?? "Someone"} wants to join "${team.teamName}"`,
      html: `<!DOCTYPE html><html><body style="margin:0;padding:24px;background:#f4f4f5;font-family:'Open Sans',Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table role="presentation" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:16px;overflow:hidden;">
<tr><td style="background:#1c1c1c;background-image:linear-gradient(260deg,#ffbe0b -29.7%,#f42b03 128.34%);padding:24px 32px;">
<p style="margin:0;font-size:20px;font-weight:700;color:#fff;">FED KIIT</p></td></tr>
<tr><td style="padding:32px;">
<h1 style="margin:0 0 14px;font-size:19px;color:#1c1c1c;">New request to join your team</h1>
<p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#3f3f46;">
<strong>${escapeHtml(input.user.name ?? input.user.email)}</strong> (${escapeHtml(input.user.email)})
would like to join <strong>${escapeHtml(team.teamName)}</strong> for
<strong>${escapeHtml(info.eventTitle || "an event")}</strong>.</p>
<table role="presentation" cellpadding="0" cellspacing="0"><tr>
<td style="border-radius:8px;background:#4caf50;"><a href="${accept}" style="display:inline-block;padding:12px 24px;font-size:15px;font-weight:600;color:#fff;text-decoration:none;">Accept</a></td>
<td style="width:12px;"></td>
<td style="border-radius:8px;background:#e74c3c;"><a href="${reject}" style="display:inline-block;padding:12px 24px;font-size:15px;font-weight:600;color:#fff;text-decoration:none;">Decline</a></td>
</tr></table>
<p style="margin:18px 0 0;font-size:13px;color:#6b7280;">This request expires in ${REQUEST_TTL_HOURS} hours.</p>
</td></tr></table></td></tr></table></body></html>`,
    });
  }

  return { requestId: request.id, status: "PENDING", expiresAt };
}

/** Marks requests past their expiry, so reads never report a stale PENDING. */
async function expireStale(where: Record<string, unknown>) {
  await prisma.teamJoinRequest.updateMany({
    where: { ...where, status: "PENDING", expiresAt: { lt: new Date() } },
    data: { status: "AUTO_EXPIRED", respondedAt: new Date() },
  });
}

/** GET /api/form/joinRequestUpdates/:formId — unseen outcomes for one event. */
export async function checkJoinRequestUpdates(formId: string, user: SafeUser) {
  await expireStale({ formId, requesterEmail: user.email });

  const updates = await prisma.teamJoinRequest.findMany({
    where: {
      formId,
      requesterEmail: user.email,
      status: { in: ["ACCEPTED", "REJECTED", "AUTO_EXPIRED", "EXPIRED"] },
      seenByRequester: false,
    },
    orderBy: { respondedAt: "desc" },
  });

  // How many of this user's requests for the event are still outstanding —
  // counted before the updates below are marked seen, as in the original.
  const pendingCount = await prisma.teamJoinRequest.count({
    where: { formId, requesterEmail: user.email, status: "PENDING" },
  });

  if (updates.length > 0) {
    await prisma.teamJoinRequest.updateMany({
      where: { id: { in: updates.map((u) => u.id) } },
      data: { seenByRequester: true },
    });
  }

  return { updates, pendingCount };
}

/** GET /api/form/allJoinRequestUpdates — unseen outcomes across every event. */
export async function checkAllJoinRequestUpdates(user: SafeUser) {
  await expireStale({ requesterEmail: user.email });

  const updates = await prisma.teamJoinRequest.findMany({
    where: {
      requesterEmail: user.email,
      status: { in: ["ACCEPTED", "REJECTED", "AUTO_EXPIRED", "EXPIRED"] },
      seenByRequester: false,
    },
    orderBy: { respondedAt: "desc" },
  });

  if (updates.length > 0) {
    await prisma.teamJoinRequest.updateMany({
      where: { id: { in: updates.map((u) => u.id) } },
      data: { seenByRequester: true },
    });
  }

  return { updates };
}

/**
 * GET /api/form/respondJoinRequest?id=&action=accept|reject
 *
 * Public, because the leader clicks it straight from an email. The request id
 * is an unguessable ObjectId and each one can only be acted on once, which is
 * what stands in for authentication here — matching the original design.
 */
export async function respondJoinRequest(input: {
  id: string;
  action: string;
}): Promise<{ status: string; message: string }> {
  if (!/^[a-f\d]{24}$/i.test(input.id)) {
    throw new ApiError(404, "That request no longer exists");
  }

  const action = input.action.toLowerCase();
  if (action !== "accept" && action !== "reject") {
    throw new ApiError(400, "Action must be accept or reject");
  }

  const request = await prisma.teamJoinRequest.findUnique({
    where: { id: input.id },
  });
  if (!request) throw new ApiError(404, "That request no longer exists");

  if (request.status !== "PENDING") {
    return {
      status: request.status,
      message: `This request was already ${request.status.toLowerCase()}.`,
    };
  }

  if (request.expiresAt.getTime() < Date.now()) {
    await prisma.teamJoinRequest.update({
      where: { id: request.id },
      data: { status: "AUTO_EXPIRED", respondedAt: new Date() },
    });
    return { status: "AUTO_EXPIRED", message: "This request has expired." };
  }

  if (action === "reject") {
    await prisma.teamJoinRequest.update({
      where: { id: request.id },
      data: { status: "REJECTED", respondedAt: new Date(), seenByRequester: false },
    });
    return { status: "REJECTED", message: "Request declined." };
  }

  // Accept. Same merge-and-delete shape as `joinTeam`: `formRegistration` is one
  // row per *team*, under `@@unique([formId, teamCode])`. An earlier version
  // stamped the team's code onto the requester's own row, which collides with
  // the team row on that constraint — accepting always failed with a P2002 and
  // the leader saw only the generic error page.

  // The requester may have joined elsewhere between asking and the leader
  // clicking; that makes this request moot rather than an error.
  const userRegistration = await prisma.formRegistration.findFirst({
    where: {
      formId: request.formId,
      regTeamMemEmails: { has: request.requesterEmail },
    },
  });

  if (!userRegistration || userRegistration.teamName !== UNAFFILIATED) {
    await prisma.teamJoinRequest.update({
      where: { id: request.id },
      data: { status: "AUTO_EXPIRED", respondedAt: new Date() },
    });
    return {
      status: "AUTO_EXPIRED",
      message: "That person has already joined another team.",
    };
  }

  const team = await prisma.formRegistration.findUnique({
    where: { id: request.teamRegistrationId },
    include: { form: { select: { info: true } } },
  });
  if (!team) throw new ApiError(404, "That team no longer exists");

  // Renaming a team and disbanding one to start another are different things,
  // and `teamRegistrationId` cannot tell them apart — the registration row is
  // reused, so its id survives both. Without this check, a leader who disbanded
  // "ABC" and created "BCD" would find the old request still live, and the
  // requester would land in a team they never asked to join.
  //
  // The code is the discriminator: a rename leaves it alone, while disbanding
  // resets it to a SOLO- code and the next createTeam mints a fresh one. So a
  // pending request survives a rename and dies with a disband, which is the
  // intended behaviour in both directions.
  //
  // A request without a pinned code predates this field and cannot be verified;
  // there were no pending ones when it shipped, so treating that as stale costs
  // nothing and fails closed.
  if (request.teamCode !== team.teamCode) {
    await prisma.teamJoinRequest.update({
      where: { id: request.id },
      data: { status: "AUTO_EXPIRED", respondedAt: new Date() },
    });
    return {
      status: "AUTO_EXPIRED",
      message:
        "That team was disbanded after this request was sent, so it can no longer be accepted. Ask them to request again.",
    };
  }

  const info = (team.form.info ?? {}) as EventInfo;
  const max = Number.parseInt(String(info.maxTeamSize ?? ""), 10) || 1;

  if (team.teamSize >= max) {
    await prisma.teamJoinRequest.update({
      where: { id: request.id },
      data: { status: "AUTO_EXPIRED", respondedAt: new Date() },
    });
    return { status: "TEAM_FULL", message: "This team is now full." };
  }

  const userValue = userRegistration.value?.[0] ?? null;

  await prisma.$transaction(async (tx) => {
    await tx.formRegistration.update({
      where: { id: team.id },
      data: {
        regTeamMemEmails: { push: request.requesterEmail },
        teamSize: { increment: 1 },
        ...(userValue ? { value: { push: userValue } } : {}),
      },
    });

    await tx.formRegistration.delete({ where: { id: userRegistration.id } });

    await tx.teamJoinRequest.update({
      where: { id: request.id },
      data: {
        status: "ACCEPTED",
        respondedAt: new Date(),
        seenByRequester: false,
      },
    });

    // Any other team they asked to join is moot now.
    await tx.teamJoinRequest.updateMany({
      where: {
        formId: request.formId,
        requesterEmail: request.requesterEmail,
        status: "PENDING",
        id: { not: request.id },
      },
      data: { status: "AUTO_EXPIRED", respondedAt: new Date() },
    });
  });

  return { status: "ACCEPTED", message: "Request accepted." };
}
