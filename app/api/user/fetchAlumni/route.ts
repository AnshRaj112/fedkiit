import { prisma } from "@/lib/db";
import { expressError, handle, json } from "@/lib/api/express";

/**
 * GET /api/user/fetchAlumni
 * Port of controllers/userController/user/getAlumni.js.
 */
export async function GET() {
  return handle(async () => {
    const users = await prisma.user.findMany({
      where: { access: { in: ["ALUMNI"] } },
      // Matches getAlumni.js exactly — note it selects no `id`, unlike
      // fetchTeam. Alumni.jsx keys its list on the array index, so adding one
      // would change nothing visually but would break byte-parity with the
      // original response.
      select: {
        name: true,
        access: true,
        img: true,
        email: true,
        extra: true,
      },
    });

    if (users.length === 0) {
      return expressError(404, "No teams found");
    }

    return json({ success: true, data: users });
  });
}
