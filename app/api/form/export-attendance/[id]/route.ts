import { exportAttendance } from "@/lib/services/attendance";
import { expressError, handle } from "@/lib/api/express";
import { getCurrentUser, isMember } from "@/lib/auth/access";

/**
 * GET /api/form/export-attendance/:id
 * Port of controllers/registration/exportAttendance — club members only.
 */
export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/form/export-attendance/[id]">,
) {
  return handle(async () => {
    const user = await getCurrentUser();
    if (!user) return expressError(401, "Token is required");
    if (!isMember(user)) return expressError(403, "Unauthorized");

    const { id } = await ctx.params;
    const { filename, csv } = await exportAttendance(id);

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    }) as never;
  });
}
