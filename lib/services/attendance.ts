import "server-only";

import { SignJWT, jwtVerify } from "jose";

import { prisma } from "@/lib/db";
import { ApiError } from "@/lib/api/errors";
import { getEnv } from "@/lib/env";
import type { SafeUser } from "@/lib/auth/access";
import type { EventInfo } from "@/lib/types/event";

/**
 * QR tokens are signed with the same secret and 20-minute lifetime the Express
 * controller used (`jwt.sign({ attendanceToken }, JWT_SECRET, { expiresIn: "20m" })`),
 * so a code minted by either implementation verifies against the other.
 */
const secret = () => new TextEncoder().encode(getEnv().JWT_SECRET);

async function signAttendanceToken(attendanceId: string): Promise<string> {
  return new SignJWT({ attendanceToken: attendanceId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("20m")
    .sign(secret());
}

/**
 * Attendance and registration export.
 *
 * Ports controllers/registration/{markAttendance,getAttendanceCode,
 * downloadRegistration,exportAttendance}.js.
 *
 * Spreadsheets are built as CSV rather than through ExcelJS. The original
 * streamed a real .xlsx via `workbook.xlsx.writeBuffer()`; CSV opens correctly
 * in Excel and Sheets, avoids adding a heavy native-ish dependency to the
 * bundle, and sidesteps the SheetJS advisories entirely.
 */

/** RFC 4180 escaping — quotes doubled, fields with delimiters quoted. */
function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const text =
    typeof value === "object" ? JSON.stringify(value) : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(rows: Array<Record<string, unknown>>): string {
  if (rows.length === 0) return "";
  const headers = [...new Set(rows.flatMap((r) => Object.keys(r)))];
  const lines = [headers.map(csvCell).join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => csvCell(row[h])).join(","));
  }
  // Excel needs a BOM to read UTF-8 correctly.
  return "﻿" + lines.join("\r\n");
}

/**
 * The caller's attendance token for an event — encoded into their QR code.
 *
 * Returns a **signed JWT that expires in 20 minutes**, not the record id. That
 * signature is the security control for the whole flow: it is why the Express
 * route left its `checkAccess` commented out, and why a scanned code cannot be
 * forged or replayed a day later. An earlier version of this port handed back
 * the raw `attendance.id`, which was both unauthenticated and permanent — and
 * did not match what `QRCodeModal` reads (`response.data.attendanceToken`).
 */
export async function getAttendanceCode(
  formId: string,
  user: SafeUser,
  teamCode?: string | null,
) {
  if (!/^[a-f\d]{24}$/i.test(formId)) throw new ApiError(404, "Form not found");

  // With a teamCode the original looked the team up directly; without one it
  // scanned every registration for the form and picked the row containing this
  // user. Both branches are preserved, including their distinct 404 messages.
  let registration = null;
  if (teamCode && teamCode.trim() !== "") {
    registration = await prisma.formRegistration.findFirst({
      where: { formId, teamCode },
    });
    if (!registration) {
      throw new ApiError(404, "Form registration not found.");
    }
  } else {
    const all = await prisma.formRegistration.findMany({ where: { formId } });
    registration =
      all.find((reg) =>
        (reg.value as Array<{ user_id?: string }>).some(
          (v) => v?.user_id === user.id,
        ),
      ) ?? null;
    if (!registration) {
      throw new ApiError(404, "Form registration not found for the user.");
    }
  }

  const info =
    (registration.value as Array<{ user_id?: string }>).find(
      (v) => v?.user_id === user.id,
    ) ?? undefined;

  const attendanceData = {
    formId,
    userId: user.id,
    teamName: registration.teamName,
    teamCode: registration.teamCode,
    info,
  };

  const record = await prisma.attendance.upsert({
    where: {
      formId_userId_teamCode: {
        formId,
        userId: user.id,
        teamCode: registration.teamCode,
      },
    },
    create: attendanceData as never,
    update: attendanceData as never,
  });

  const token = await signAttendanceToken(record.id);

  return { message: "Validation id generated successfully.", attendanceToken: token };
}

/**
 * Marks a scanned attendance record present.
 *
 * Requires a club member — the original mounted this with its access check
 * commented out, so any signed-in user could mark anyone present.
 */
export async function markAttendance(input: {
  formId?: string;
  token?: string;
}) {
  const token = input.token?.trim();
  if (!token) throw new ApiError(400, "Attendance token is required.");

  // The scanned value is the signed QR token, not a record id. Verifying it is
  // what stops a stale or hand-crafted QR from marking anyone present.
  let attendanceId: string | undefined;
  try {
    const { payload } = await jwtVerify(token, secret(), {
      algorithms: ["HS256"],
    });
    attendanceId = payload.attendanceToken as string | undefined;
  } catch {
    throw new ApiError(401, "Invalid or expired QR.");
  }

  if (!attendanceId) {
    throw new ApiError(400, "Attendance ID is missing in the token.");
  }

  const record = await prisma.attendance.findUnique({
    where: { id: attendanceId },
  });
  if (!record) throw new ApiError(404, "Attendance record not found.");

  // A QR for one event must not check someone in at another.
  if (record.formId !== input.formId) {
    throw new ApiError(400, "QR does not belong to the specified form.");
  }

  if (record.isPresent) throw new ApiError(400, "Attendance already marked.");

  const updated = await prisma.attendance.update({
    where: { id: attendanceId },
    data: { isPresent: true, markedAt: new Date() },
  });

  return { message: "Attendance marked successfully.", attendance: updated };
}

export type StoredField = { name?: string; type?: string; value?: unknown };
export type StoredSubmission = {
  user_name?: string;
  user_email?: string;
  date_time?: string;
  amount?: string;
  sections?: Array<{ name?: string; fields?: StoredField[] }>;
};

const isHttpUrl = (v: unknown): v is string =>
  typeof v === "string" && /^https?:\/\//i.test(v);

/**
 * Pulls the payment answers out of a stored submission.
 *
 * Located by shape and by name pattern rather than by a fixed index, because
 * admins can rename and reorder the sections a form is built from. Shared with
 * the payments endpoint so the two cannot drift.
 */
export function paymentFromSubmission(submission: StoredSubmission): {
  utr: string;
  screenshot: string | null;
} {
  const fields = (submission.sections ?? []).flatMap((section) =>
    Array.isArray(section?.fields) ? section.fields : [],
  );

  const utr = fields.find((f) => /utr|transaction/i.test(f?.name ?? ""));
  // Matched on the stored URL rather than on `type`: a renamed field still
  // uploads to the same place, and a media field left blank is null.
  const screenshot = fields.find(
    (f) => (f?.type === "image" || f?.type === "file") && isHttpUrl(f?.value),
  );

  return {
    utr: utr?.value == null ? "" : String(utr.value),
    screenshot: isHttpUrl(screenshot?.value) ? screenshot.value : null,
  };
}

/** Flattens a registration's stored submission into spreadsheet columns. */
function flattenRegistration(row: {
  teamName: string;
  teamCode: string;
  teamSize: number;
  regTeamMemEmails: string[];
  value: unknown[];
}): Record<string, unknown> {
  const out: Record<string, unknown> = {
    teamName: row.teamName,
    teamCode: row.teamCode,
    teamSize: row.teamSize,
    teamMembers: row.regTeamMemEmails.join("; "),
  };

  for (const submission of row.value ?? []) {
    const s = submission as {
      user_name?: string;
      user_email?: string;
      date_time?: string;
      amount?: string;
      sections?: Array<{ fields?: Array<{ name?: string; value?: unknown }> }>;
    };

    out.name ??= s.user_name;
    out.email ??= s.user_email;
    out.registeredAt ??= s.date_time;
    out.amount ??= s.amount;

    for (const section of s.sections ?? []) {
      for (const field of section.fields ?? []) {
        if (field?.name && out[field.name] === undefined) {
          out[field.name] = field.value;
        }
      }
    }
  }

  return out;
}

/** All registrations for a form, as spreadsheet rows. */
export async function exportRegistrations(formId: string) {
  if (!/^[a-f\d]{24}$/i.test(formId)) throw new ApiError(404, "Form not found");

  const form = await prisma.form.findUnique({
    where: { id: formId },
    select: { info: true },
  });
  if (!form) throw new ApiError(404, "Form not found");

  const registrations = await prisma.formRegistration.findMany({
    where: { formId },
    select: {
      teamName: true,
      teamCode: true,
      teamSize: true,
      regTeamMemEmails: true,
      value: true,
    },
  });

  const title = ((form.info ?? {}) as EventInfo).eventTitle ?? "registrations";
  return {
    filename: `${title.replace(/[^\w\-]+/g, "_")}_registrations.csv`,
    csv: toCsv(registrations.map(flattenRegistration)),
    count: registrations.length,
  };
}

/** Attendance rows for a form, as spreadsheet rows. */
export async function exportAttendance(formId: string) {
  if (!/^[a-f\d]{24}$/i.test(formId)) throw new ApiError(404, "Form not found");

  const form = await prisma.form.findUnique({
    where: { id: formId },
    select: { info: true },
  });
  if (!form) throw new ApiError(404, "Form not found");

  const records = await prisma.attendance.findMany({ where: { formId } });

  const userIds = [...new Set(records.map((r) => r.userId))];
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true, rollNumber: true },
  });
  const byId = new Map(users.map((u) => [u.id, u]));

  // Payment proof lives on the registration, not on the attendance record, so
  // it has to be joined in. Without this the attendance sheet gave a desk
  // volunteer no way to check a payment against what the participant uploaded.
  const registrations = await prisma.formRegistration.findMany({
    where: { formId },
    select: { userId: true, value: true },
  });
  const paymentByUser = new Map<
    string,
    { utr: string; screenshot: string | null }
  >();
  for (const registration of registrations) {
    for (const entry of registration.value ?? []) {
      const payment = paymentFromSubmission(entry as StoredSubmission);
      if (payment.utr || payment.screenshot) {
        paymentByUser.set(registration.userId, payment);
        break;
      }
    }
  }

  const rows = records.map((r) => {
    const u = byId.get(r.userId);
    const payment = paymentByUser.get(r.userId);
    return {
      name: u?.name ?? "",
      email: u?.email ?? "",
      rollNumber: u?.rollNumber ?? "",
      teamName: r.teamName,
      teamCode: r.teamCode,
      isPresent: r.isPresent ? "YES" : "NO",
      isPaymentVerified: r.isPaymentVerified ? "YES" : "NO",
      markedAt: r.markedAt ? r.markedAt.toISOString() : "",
      utr: payment?.utr ?? "",
      paymentScreenshot: payment?.screenshot ?? "",
    };
  });

  const title = ((form.info ?? {}) as EventInfo).eventTitle ?? "attendance";
  return {
    filename: `${title.replace(/[^\w\-]+/g, "_")}_attendance.csv`,
    csv: toCsv(rows),
    count: rows.length,
  };
}
