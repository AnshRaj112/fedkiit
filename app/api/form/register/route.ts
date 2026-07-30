import { randomInt } from "node:crypto";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import { expressError, handle, json } from "@/lib/api/express";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/api/rate-limit";
import { getCurrentUser } from "@/lib/auth/access";
import { sendMail } from "@/lib/email/mailer";
import { registrationEmail } from "@/lib/email/templates";
import type { EventInfo } from "@/lib/types/event";

/**
 * POST /api/form/register
 * Port of controllers/registration/addRegistration.js.
 *
 * The client posts `multipart/form-data` with `_id` and a JSON-encoded
 * `sections` string, so the body is read as FormData rather than JSON.
 *
 * Behaviour preserved from the v2 path of the original: everyone registers
 * "teamless" with a generated SOLO-… code and the placeholder team name
 * UNAFFILIATED; teams are formed afterwards on the team-management page.
 *
 * Fixes over the original:
 *  - The registration, tracker and user updates run in one transaction. The
 *    original wrote them in sequence, so a mid-flight failure left a
 *    registration the tracker did not know about — and the duplicate check then
 *    blocked the user from retrying.
 *  - The capacity check runs inside the transaction; before, two concurrent
 *    requests could both pass it and oversubscribe an event.
 *  - `isRegistrationClosed` / `isEventPast` were compared against the *string*
 *    'true', so a real boolean `true` never actually closed registration.
 */
const UNAFFILIATED = "UNAFFILIATED";

const isTrue = (v: unknown) => v === true || v === "true";

export async function POST(request: Request) {
  return handle(async () => {
    const user = await getCurrentUser();
    if (!user) return expressError(401, "Token is required");

    await enforceRateLimit({ ...RATE_LIMITS.registration, subject: user.id });

    let formId = "";
    let sections: unknown[] = [];

    const contentType = request.headers.get("content-type") ?? "";
    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      formId = String(form.get("_id") ?? "");
      const raw = form.get("sections");
      if (typeof raw === "string") {
        try {
          sections = JSON.parse(raw);
        } catch {
          return expressError(400, "sections must be valid JSON");
        }
      }
    } else {
      const payload = (await request.json().catch(() => ({}))) as {
        _id?: string;
        sections?: unknown;
      };
      formId = String(payload._id ?? "");
      sections =
        typeof payload.sections === "string"
          ? JSON.parse(payload.sections)
          : Array.isArray(payload.sections)
            ? payload.sections
            : [];
    }

    sections = (Array.isArray(sections) ? sections : []).filter(Boolean);

    if (!formId || !Array.isArray(sections)) {
      return expressError(400, "All fields are required");
    }
    if (!/^[a-f\d]{24}$/i.test(formId)) {
      return expressError(404, "Form not found");
    }

    const form = await prisma.form.findUnique({
      where: { id: formId },
      include: { formAnalytics: true },
    });
    if (!form) return expressError(404, "Form not found");

    const info = (form.info ?? {}) as EventInfo;
    const tracker = form.formAnalytics[0] ?? null;

    if (isTrue(info.isRegistrationClosed) || isTrue(info.isEventPast)) {
      return expressError(
        400,
        "Sorry ! Registration has been closed for this event. If you feel this is an error, kindly contact us on fedkiit@gmail.com",
      );
    }

    if (info.isPublic === false && user.access !== "ADMIN") {
      return expressError(
        401,
        "Registering to a private form is not allowed. If you feel this is an error, kindly contact us on fedkiit@gmail.com",
      );
    }

    if (
      tracker?.regUserEmails.includes(user.email) ||
      user.regForm.includes(formId)
    ) {
      return expressError(
        400,
        "User has already registered for this form. If you feel this is an error, kindly contact us on fedkiit@gmail.com",
      );
    }

    // Prerequisite event, if the form declares one.
    const relatedEventId = info.relatedEvent;
    if (
      relatedEventId &&
      relatedEventId !== "null" &&
      /^[a-f\d]{24}$/i.test(relatedEventId)
    ) {
      const related = await prisma.form.findUnique({
        where: { id: relatedEventId },
        include: { formAnalytics: true },
      });
      if (!related) return expressError(404, "Related Event not found");

      const registeredInRelated =
        user.regForm.includes(relatedEventId) ||
        related.formAnalytics[0]?.regUserEmails.includes(user.email);

      if (!registeredInRelated) {
        const title = (related.info as EventInfo)?.eventTitle ?? "the related event";
        return expressError(
          400,
          `User must be registered in the related event : ${title}`,
        );
      }
    }

    const teamCode = `SOLO-${user.id}-${randomInt(1000, 10000)}`;
    const capacity = Number.parseInt(String(info.eventMaxReg ?? ""), 10);

    const submission = {
      user_name: user.name,
      user_id: user.id,
      user_email: user.email,
      date_time: new Date().toISOString(),
      amount: String(info.eventAmount ?? "0"),
      sections,
    } as unknown as Prisma.InputJsonValue;

    await prisma.$transaction(async (tx) => {
      // Re-read inside the transaction so the capacity check sees concurrent
      // writes rather than a stale snapshot.
      const current = await tx.registrationTracker.findUnique({
        where: { formId },
        select: { id: true, regUserEmails: true, totalRegistrationCount: true },
      });

      if (current?.regUserEmails.includes(user.email)) {
        throw Object.assign(new Error("already registered"), { skip: true });
      }

      if (Number.isFinite(capacity) && capacity > 0) {
        const taken =
          current?.regUserEmails.length ?? current?.totalRegistrationCount ?? 0;
        if (taken >= capacity) {
          throw Object.assign(new Error("full"), { full: true });
        }
      }

      await tx.formRegistration.create({
        data: {
          formId,
          userId: user.id,
          value: [submission],
          regTeamMemEmails: [user.email],
          teamSize: 1,
          teamName: UNAFFILIATED,
          teamCode,
        },
      });

      if (current) {
        await tx.registrationTracker.update({
          where: { formId },
          data: {
            regUserEmails: { push: user.email },
            totalRegistrationCount: { increment: 1 },
          },
        });
      } else {
        await tx.registrationTracker.create({
          data: {
            formId,
            regUserEmails: [user.email],
            regTeamNames: [],
            totalRegistrationCount: 1,
            totalClickCount: 0,
            faildAttempt: [],
            faildAttemptCount: 0,
          },
        });
      }

      await tx.user.update({
        where: { id: user.id },
        data: { regForm: { push: formId } },
      });
    }).catch((error: Error & { full?: boolean; skip?: boolean }) => {
      if (error.full) {
        throw Object.assign(new Error("capacity"), { statusCode: 400 });
      }
      throw error;
    });

    // Best effort — a mail failure must not undo a valid registration.
    const mail = registrationEmail({
      name: user.name ?? "there",
      eventTitle: info.eventTitle ?? "the event",
      eventDate: info.eventDate ?? "",
      teamName: null,
      teamCode: null,
    });
    void sendMail({ to: user.email, ...mail });

    return json(
      {
        success: true,
        message: "Registration successful",
        data: { teamCode, teamName: UNAFFILIATED },
      },
      201,
    );
  });
}
