import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";
import { expressError, handle, json } from "@/lib/api/express";
import { getCurrentUser, isAdmin } from "@/lib/auth/access";
import { uploadImage } from "@/lib/services/upload";
import type { EventInfo } from "@/lib/types/event";

/**
 * PUT /api/form/editForm/:id
 * Port of controllers/forms/editForm.js — admin only.
 *
 * Merges submitted fields into the existing `info` blob rather than replacing
 * it, so a partial edit cannot silently blank out fields the form did not post.
 */
export async function PUT(
  request: Request,
  ctx: RouteContext<"/api/form/editForm/[id]">,
) {
  return handle(async () => {
    const user = await getCurrentUser();
    if (!user) return expressError(401, "Token is required");
    if (!isAdmin(user)) return expressError(403, "Unauthorized");

    const { id } = await ctx.params;
    if (!/^[a-f\d]{24}$/i.test(id)) return expressError(404, "Form not found");

    const existing = await prisma.form.findUnique({ where: { id } });
    if (!existing) return expressError(404, "Form not found");

    const form = await request.formData();
    const text = (key: string) => {
      const v = form.get(key);
      return typeof v === "string" ? v : undefined;
    };

    const info: EventInfo & Record<string, unknown> = {
      ...((existing.info ?? {}) as EventInfo),
    };

    const stringFields = [
      "eventTitle",
      "eventdescription",
      "eventDate",
      "eventType",
      "eventAmount",
      "eventMaxReg",
      "relatedEvent",
      "participationType",
      "maxTeamSize",
      "minTeamSize",
      "regDateAndTime",
      "eventPriority",
      "successMessage",
    ] as const;

    for (const field of stringFields) {
      const value = text(field);
      if (value !== undefined) info[field] = value;
    }

    for (const flag of [
      "isPublic",
      "isRegistrationClosed",
      "isEventPast",
    ] as const) {
      const value = text(flag);
      if (value !== undefined) info[flag] = value === "true";
    }

    const upi = text("upi");
    if (upi !== undefined) {
      info.receiverDetails = { ...(info.receiverDetails ?? {}), upi };
    }

    // Merged one key at a time, like `upi` above: a partial edit must not blank
    // out settings the request did not carry.
    const paymentMode = text("paymentMode");
    if (paymentMode !== undefined) {
      info.receiverDetails = {
        ...(info.receiverDetails ?? {}),
        mode: paymentMode === "Link" ? "Link" : "QR",
      };
    }

    for (const [key, field] of [
      ["paymentLink", "link"],
      ["paymentButtonText", "buttonText"],
      ["paymentMessage", "message"],
    ] as const) {
      const value = text(key);
      if (value !== undefined) {
        info.receiverDetails = {
          ...(info.receiverDetails ?? {}),
          [field]: value || null,
        };
      }
    }

    const eventImg = form.get("eventImg");
    if (eventImg instanceof File && eventImg.size > 0) {
      const result = await uploadImage(eventImg, "FormImages");
      if (result) info.eventImg = result.secure_url;
    }

    const media = form.get("media");
    if (media instanceof File && media.size > 0) {
      const result = await uploadImage(media, "QRMediaImages");
      if (result) {
        info.receiverDetails = {
          ...(info.receiverDetails ?? {}),
          media: result.secure_url,
        };
      }
    }

    const data: Prisma.formUpdateInput = {
      info: info as Prisma.InputJsonValue,
    };

    const rawSections = text("sections");
    if (rawSections) {
      try {
        data.sections = JSON.parse(rawSections) as Prisma.InputJsonValue[];
      } catch {
        return expressError(400, "sections must be valid JSON");
      }
    }

    const updated = await prisma.form.update({ where: { id }, data });

    revalidatePath("/Events");

    return json({
      success: true,
      message: "Form info and sections updated successfully",
      form: updated,
    });
  });
}
