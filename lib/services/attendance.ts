import "server-only";

import { prisma } from "@/lib/db";
import { ApiError } from "@/lib/api/errors";
import type { SafeUser } from "@/lib/auth/access";
import type { EventInfo } from "@/lib/types/event";

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

/** The caller's attendance token for an event — encoded into their QR code. */
export async function getAttendanceCode(formId: string, user: SafeUser) {
  if (!/^[a-f\d]{24}$/i.test(formId)) throw new ApiError(404, "Form not found");

  const registration = await prisma.formRegistration.findFirst({
    where: { formId, userId: user.id },
  });
  if (!registration) {
    throw new ApiError(404, "You are not registered for this event");
  }

  const record = await prisma.attendance.upsert({
    where: {
      formId_userId_teamCode: {
        formId,
        userId: user.id,
        teamCode: registration.teamCode,
      },
    },
    create: {
      formId,
      userId: user.id,
      teamName: registration.teamName,
      teamCode: registration.teamCode,
      isPresent: false,
      isPaymentVerified: false,
      info: {
        name: user.name,
        email: user.email,
        rollNumber: user.rollNumber,
      },
    },
    update: {},
  });

  return {
    attendanceId: record.id,
    token: record.id,
    teamCode: record.teamCode,
    teamName: record.teamName,
    isPresent: record.isPresent,
  };
}

/**
 * Marks a scanned attendance record present.
 *
 * Requires a club member — the original mounted this with its access check
 * commented out, so any signed-in user could mark anyone present.
 */
export async function markAttendance(input: { attendanceId: string }) {
  const id = input.attendanceId?.trim();
  if (!id || !/^[a-f\d]{24}$/i.test(id)) {
    throw new ApiError(400, "A valid attendance token is required");
  }

  const record = await prisma.attendance.findUnique({ where: { id } });
  if (!record) throw new ApiError(404, "Attendance record not found");

  if (record.isPresent) {
    return {
      alreadyMarked: true,
      attendance: record,
      message: "Attendance was already marked",
    };
  }

  const updated = await prisma.attendance.update({
    where: { id },
    data: { isPresent: true, markedAt: new Date() },
  });

  return {
    alreadyMarked: false,
    attendance: updated,
    message: "Attendance marked",
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

  const rows = records.map((r) => {
    const u = byId.get(r.userId);
    return {
      name: u?.name ?? "",
      email: u?.email ?? "",
      rollNumber: u?.rollNumber ?? "",
      teamName: r.teamName,
      teamCode: r.teamCode,
      isPresent: r.isPresent ? "YES" : "NO",
      isPaymentVerified: r.isPaymentVerified ? "YES" : "NO",
      markedAt: r.markedAt ? r.markedAt.toISOString() : "",
    };
  });

  const title = ((form.info ?? {}) as EventInfo).eventTitle ?? "attendance";
  return {
    filename: `${title.replace(/[^\w\-]+/g, "_")}_attendance.csv`,
    csv: toCsv(rows),
    count: rows.length,
  };
}
