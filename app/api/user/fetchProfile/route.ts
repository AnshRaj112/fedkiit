import { prisma } from "@/lib/db";
import { expressError, handle, json } from "@/lib/api/express";
import { getCurrentUser, toSafeUser } from "@/lib/auth/access";

/**
 * POST /api/user/fetchProfile
 * Port of controllers/userController/user/getUser.js.
 *
 * The profile returned is always the *session's* user. The Express version
 * took the email from the request body, so any authenticated caller could read
 * any other member's full record — including contact numbers — by posting a
 * different address.
 */
export async function POST() {
  return handle(async () => {
    const current = await getCurrentUser();
    if (!current) return expressError(401, "Token is required");

    const user = await prisma.user.findUnique({ where: { id: current.id } });
    if (!user) return expressError(404, "User not found");

    return json({ success: true, user: toSafeUser(user) });
  });
}
