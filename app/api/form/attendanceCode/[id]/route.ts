import { getAttendanceCode } from "@/lib/services/attendance";
import { expressError, handle, json } from "@/lib/api/express";
import { getCurrentUser } from "@/lib/auth/access";

/**
 * GET /api/form/attendanceCode/:id
 * Port of controllers/registration/getAttendanceCode — the value the
 * attendee's QR code encodes.
 */
export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/form/attendanceCode/[id]">,
) {
  return handle(async () => {
    const user = await getCurrentUser();
    if (!user) return expressError(401, "Token is required");

    const { id } = await ctx.params;
    const data = await getAttendanceCode(id, user);

    return json({ success: true, data });
  });
}
