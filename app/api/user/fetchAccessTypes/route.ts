import { AccessTypes } from "@prisma/client";

import { handle, json } from "@/lib/api/express";

/**
 * GET /api/user/fetchAccessTypes
 * Port of controllers/userController/member/fetchAccessTypes.js — the enum
 * values, used to populate the admin member-role dropdown.
 */
export async function GET() {
  return handle(async () =>
    json({ success: true, data: Object.values(AccessTypes) }),
  );
}
