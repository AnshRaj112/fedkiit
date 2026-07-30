import { exportRegistrations } from "@/lib/services/attendance";
import { expressError, handle } from "@/lib/api/express";
import { getCurrentUser, isAdmin } from "@/lib/auth/access";

/**
 * GET /api/form/download/:id
 * Port of controllers/registration/downloadRegistration.js — admin only.
 *
 * Streams CSV rather than the original's ExcelJS .xlsx: it opens identically in
 * Excel and Sheets, and avoids pulling a spreadsheet writer into the bundle.
 */
export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/form/download/[id]">,
) {
  return handle(async () => {
    const user = await getCurrentUser();
    if (!user) return expressError(401, "Token is required");
    if (!isAdmin(user)) return expressError(403, "Unauthorized");

    const { id } = await ctx.params;
    const { filename, csv } = await exportRegistrations(id);

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    }) as never;
  });
}
