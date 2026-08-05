import { markAttendance } from "@/lib/services/attendance";
import { body, expressError, handle, json } from "@/lib/api/express";
import { getCurrentUser } from "@/lib/auth/access";

/**
 * POST /api/form/markAttendance
 * Port of controllers/registration/markAttendance.js.
 *
 * Signed-in callers only, with no access-level check — matching the Express
 * route, which has its `checkAccess` call commented out. That is deliberate on
 * their side: the volunteer scanning at the door signs in as a plain USER, so
 * requiring club-member access locks the door staff out. The real control is
 * the signed, 20-minute QR token, which `markAttendance` verifies.
 *
 * Responds `{ message, attendance }` at the top level, which is the shape
 * AttendancePage reads.
 */
export async function POST(request: Request) {
  return handle(async () => {
    const user = await getCurrentUser();
    if (!user) return expressError(401, "Token is required");

    const b = await body<{ formId?: string; token?: string }>(request);
    const result = await markAttendance({ formId: b.formId, token: b.token });

    return json(result);
  });
}
