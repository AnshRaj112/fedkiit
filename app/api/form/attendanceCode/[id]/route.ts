import { getAttendanceCode } from "@/lib/services/attendance";
import { expressError, handle, json } from "@/lib/api/express";
import { getCurrentUser } from "@/lib/auth/access";

/**
 * GET /api/form/attendanceCode/:id?teamCode=
 * Port of controllers/registration/getAttendanceCode.
 *
 * Responds `{ message, attendanceToken }` at the top level: QRCodeModal reads
 * `response.data.attendanceToken` and encodes it straight into the QR image.
 * `attendanceToken` is a signed JWT expiring in 20 minutes, not the attendance
 * record's id.
 */
export async function GET(
  request: Request,
  ctx: RouteContext<"/api/form/attendanceCode/[id]">,
) {
  return handle(async () => {
    const user = await getCurrentUser();
    if (!user) return expressError(401, "Token is required");

    const { id } = await ctx.params;
    const teamCode = new URL(request.url).searchParams.get("teamCode");

    return json(await getAttendanceCode(id, user, teamCode));
  });
}
