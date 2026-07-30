import { AccessTypes } from "@prisma/client";

import { prisma } from "@/lib/db";
import { body, expressError, handle, json } from "@/lib/api/express";
import { getCurrentUser, isAdmin } from "@/lib/auth/access";
import { hashPassword } from "@/lib/auth/password";

/**
 * POST /api/user/addMember
 * Port of controllers/userController/member/addMember.js — admin only.
 *
 * Creates the account if the email is new, otherwise promotes the existing
 * user to the given access level (the original `createOrUpdateUser` behaviour).
 */
export async function POST(request: Request) {
  return handle(async () => {
    const admin = await getCurrentUser();
    if (!admin) return expressError(401, "Token is required");
    if (!isAdmin(admin)) return expressError(403, "Unauthorized");

    const data = await body<Record<string, string>>(request);
    const { email, name, access } = data;

    if (!email || !name || !access) {
      return expressError(400, "Email, name and access are required");
    }

    if (!Object.values(AccessTypes).includes(access as AccessTypes)) {
      return expressError(400, `Invalid access type: ${access}`);
    }

    const address = email.trim().toLowerCase();

    const extra = {
      github: data.github ?? "",
      linkedin: data.linkedin ?? "",
      designation: data.designation ?? "",
      title: data.title ?? "",
    };

    const existing = await prisma.user.findUnique({
      where: { email: address },
      select: { id: true },
    });

    if (existing) {
      const updated = await prisma.user.update({
        where: { id: existing.id },
        data: {
          name,
          access: access as AccessTypes,
          year: data.year || undefined,
          img: data.img || undefined,
          rollNumber: data.rollNumber || undefined,
          school: data.school || undefined,
          college: data.college || undefined,
          contactNo: data.contactNo || undefined,
          extra,
        },
        select: { id: true, email: true, name: true, access: true },
      });

      return json({
        success: true,
        message: "Member updated successfully",
        user: updated,
      });
    }

    // A member added by an admin has no password yet. Store an unusable
    // placeholder rather than an empty string, so bcrypt.compare can never
    // succeed against it — they must use "forgot password" to set one.
    const created = await prisma.user.create({
      data: {
        email: address,
        name,
        access: access as AccessTypes,
        password: `admin-created:${crypto.randomUUID()}`,
        year: data.year || null,
        img: data.img || null,
        rollNumber: data.rollNumber || null,
        school: data.school || null,
        college: data.college || null,
        contactNo: data.contactNo || null,
        extra,
        editProfileCount: 5,
        regForm: [],
      },
      select: { id: true, email: true, name: true, access: true },
    });

    return json(
      { success: true, message: "Member added successfully", user: created },
      201,
    );
  });
}
