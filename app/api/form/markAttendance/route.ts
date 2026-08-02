import { markAttendance } from "@/lib/services/attendance";
import { body, expressError, handle, json } from "@/lib/api/express";
import { getCurrentUser, isMember } from "@/lib/auth/access";

/**
 * POST /api/form/markAttendance
 * Port of controllers/registration/markAttendance.js.
 *
 * Requires a club member. The Express route had its `checkAccess` call
 * commented out, so any signed-in user could mark any attendee present.
 */
export async function POST(request: Request) {
  return handle(async () => {
    const user = await getCurrentUser();
    if (!user) return expressError(401, "Token is required");
    if (!isMember(user)) return expressError(403, "Unauthorized");

    const b = await body<Record<string, string>>(request);
    const data = await markAttendance({
      attendanceId: b.attendanceId ?? b.token ?? b.id ?? "",
    });

    return json({ success: true, message: data.message, data });
  });
}
