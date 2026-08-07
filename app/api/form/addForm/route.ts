import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";
import { expressError, handle, json } from "@/lib/api/express";
import { getCurrentUser, isAdmin } from "@/lib/auth/access";
import { uploadImage } from "@/lib/services/upload";

/**
 * POST /api/form/addForm
 * Port of controllers/forms/addForm.js — admin only.
 *
 * Accepts multipart/form-data with `eventImg` and `media` files plus the event
 * fields, and assembles the same `info` blob the original wrote, so existing
 * documents and new ones stay structurally identical.
 */
/**
 * Upload dimensions come from `lib/config/images.ts`.
 *
 * They were literals here and in `editForm`, and the two had drifted: Express
 * declares `QrImageWidth = 400, QrImageHeight = 150` in both controllers, but
 * `addForm` passed them into `uploadimage(path, folder, height, width)` in the
 * wrong order, so it uploaded QR media at 150x400 while `editForm` used
 * 400x150. Centralising picks the declared intent, which is what `editForm`
 * already did — so this call changes, deliberately, to match.
 */

export async function POST(request: Request) {
  return handle(async () => {
    const user = await getCurrentUser();
    if (!user) return expressError(401, "Token is required");
    if (!isAdmin(user)) return expressError(403, "Unauthorized");

    const form = await request.formData();
    const text = (key: string) => {
      const v = form.get(key);
      return typeof v === "string" ? v : undefined;
    };

    const info: Record<string, unknown> = {
      eventTitle: text("eventTitle"),
      eventdescription: text("eventdescription"),
      eventDate: text("eventDate"),
      eventType: text("eventType"),
      eventAmount: text("eventAmount"),
      eventMaxReg: text("eventMaxReg"),
      relatedEvent: text("relatedEvent"),
      participationType: text("participationType"),
      maxTeamSize: text("maxTeamSize"),
      minTeamSize: text("minTeamSize"),
      regDateAndTime: text("regDateAndTime"),
      eventPriority: text("eventPriority"),
      successMessage: text("successMessage"),
      // The original used Boolean(value), which is true for the *string*
      // "false". Compare explicitly so an unchecked box stays false.
      isPublic: text("isPublic") === "true",
      isRegistrationClosed: text("isRegistrationClosed") === "true",
      isEventPast: text("isEventPast") === "true",
      receiverDetails: {
        upi: text("upi") ?? null,
        media: null as string | null,
        // Anything other than "Link" is QR — that is the historical behaviour
        // and the safe default if the field is missing or malformed.
        mode: text("paymentMode") === "Link" ? "Link" : "QR",
        link: text("paymentLink") || null,
        buttonText: text("paymentButtonText") || null,
        message: text("paymentMessage") || null,
      },
    };

    const eventImg = form.get("eventImg");
    if (eventImg instanceof File && eventImg.size > 0) {
      const result = await uploadImage(eventImg, "FormImages");
      info.eventImg = result?.secure_url ?? null;
    }

    const media = form.get("media");
    if (media instanceof File && media.size > 0) {
      const result = await uploadImage(media, "QRMediaImages");
      (info.receiverDetails as { media: string | null }).media =
        result?.secure_url ?? null;
    }

    let sections: unknown[] = [];
    const rawSections = text("sections");
    if (rawSections) {
      try {
        sections = JSON.parse(rawSections);
      } catch {
        return expressError(400, "sections must be valid JSON");
      }
    }

    const created = await prisma.form.create({
      data: {
        info: info as Prisma.InputJsonValue,
        sections: sections as Prisma.InputJsonValue[],
      },
    });

    // Drop the cached listing so the new event shows up immediately.
    revalidatePath("/Events");

    // 200 and this wording are what the Express controller returned.
    return json({
      success: true,
      message: "Form created successfully",
      form: created,
    });
  });
}
