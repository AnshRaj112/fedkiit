import { addCertificateTemplate } from "@/lib/services/certificates";
import { body, expressError, handle, json } from "@/lib/api/express";
import { getCurrentUser, isAdmin } from "@/lib/auth/access";

/**
 * POST /api/certificate/addCertificateTemplate
 * Port of controllers/certificate/certificateController.js — admin only.
 */
export async function POST(request: Request) {
  return handle(async () => {
    const user = await getCurrentUser();
    if (!user) return expressError(401, "Token is required");
    if (!isAdmin(user)) return expressError(403, "Unauthorized");

    const b = await body<{
      eventId?: string;
      template?: string;
      fields?: unknown;
    }>(request);

    const fields = Array.isArray(b.fields)
      ? b.fields
      : typeof b.fields === "string"
        ? JSON.parse(b.fields)
        : [];

    const record = await addCertificateTemplate({
      eventId: b.eventId ?? "",
      template: b.template ?? "",
      fields,
    });

    return json({ success: true, message: "Template saved", certificate: record });
  });
}
