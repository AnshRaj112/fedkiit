import { prisma } from "@/lib/db";
import { body, expressError, handle, json } from "@/lib/api/express";
import { getCurrentUser, isAdmin, toSafeUser } from "@/lib/auth/access";
import { normalizeYear } from "@/lib/academic";

/**
 * PUT /api/user/editDetails
 * Port of controllers/userController/member/editProfile.js.
 *
 * A user may only edit their own profile; admins may edit anyone by passing an
 * `email`. The original took the target email straight from the request body
 * with no ownership check, so any authenticated user could rewrite another
 * member's profile — including their access level.
 */
export async function PUT(request: Request) {
  return handle(async () => {
    const current = await getCurrentUser();
    if (!current) return expressError(401, "Token is required");

    const data = await body<Record<string, string>>(request);

    const targetEmail = data.email?.trim().toLowerCase();
    const editingSomeoneElse = targetEmail && targetEmail !== current.email;

    if (editingSomeoneElse && !isAdmin(current)) {
      return expressError(403, "You can only edit your own profile");
    }

    const target = editingSomeoneElse
      ? await prisma.user.findUnique({ where: { email: targetEmail } })
      : await prisma.user.findUnique({ where: { id: current.id } });

    if (!target) return expressError(404, "User not found");

    // The original decremented an edit allowance; preserved for self-edits.
    if (!editingSomeoneElse && (target.editProfileCount ?? 0) <= 0) {
      return expressError(403, "You have no profile edits remaining");
    }

    const extra = {
      ...((target.extra as Record<string, unknown>) ?? {}),
      ...(data.github !== undefined ? { github: data.github } : {}),
      ...(data.linkedin !== undefined ? { linkedin: data.linkedin } : {}),
      ...(data.designation !== undefined
        ? { designation: data.designation }
        : {}),
    };

    const updated = await prisma.user.update({
      where: { id: target.id },
      data: {
        name: data.name ?? target.name,
        rollNumber: data.rollNumber ?? target.rollNumber,
        school: data.school ?? target.school,
        college: data.college ?? target.college,
        contactNo: data.contactNo ?? target.contactNo,
        whatsappNo: data.whatsappNo ?? target.whatsappNo,
        // Editable, and never recomputed behind the user's back: a
        // lateral-entry student sets a year their roll number does not imply,
        // and re-deriving on save would silently undo it every time. Only
        // normalised, so the stored spelling stays consistent.
        year: normalizeYear(data.year) ?? target.year,
        img: data.img ?? target.img,
        extra,
        // Access is never taken from the request body unless an admin sets it.
        ...(isAdmin(current) && data.access
          ? { access: data.access as never }
          : {}),
        ...(editingSomeoneElse
          ? {}
          : { editProfileCount: Math.max(0, (target.editProfileCount ?? 1) - 1) }),
      },
    });

    return json({
      success: true,
      message: "Profile updated successfully",
      user: toSafeUser(updated),
    });
  });
}
