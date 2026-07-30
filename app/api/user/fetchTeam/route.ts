import { prisma } from "@/lib/db";
import { expressError, handle, json } from "@/lib/api/express";

/**
 * GET /api/user/fetchTeam
 *
 * Port of controllers/userController/user/getTeam.js. The projection matches the original
 * exactly — Team.jsx sorts on `member.year`, which the Express endpoint never
 * selected, so adding it here would silently reorder the roster.
 */
export async function GET() {
  return handle(async () => {
    const users = await prisma.user.findMany({
      where: { access: { notIn: ["USER", "ADMIN"] } },
      select: {
        id: true,
        name: true,
        access: true,
        img: true,
        email: true,
        extra: true,
      },
    });

    if (users.length === 0) {
      // Preserved from the original, which 404'd on an empty roster.
      return expressError(404, "No teams found");
    }

    return json({ success: true, data: users });
  });
}
