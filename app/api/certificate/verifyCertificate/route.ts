import { verifyCertificate } from "@/lib/services/certificates";
import { body, expressError, handle, json } from "@/lib/api/express";

/**
 * POST /api/certificate/verifyCertificate
 * Port of controllers/certificate/certificateController.js.
 *
 * Public: this backs the shareable /verify/certificate page. It returns only
 * what a verifier needs — the recipient name, the event and the image — never
 * the wider issued list.
 */
export async function POST(request: Request) {
  return handle(async () => {
    const b = await body<{ id?: string; certificateId?: string }>(request);
    const id = b.id ?? b.certificateId ?? "";

    if (!id) return expressError(400, "Certificate ID is required");

    const data = await verifyCertificate(id);
    return json(data);
  });
}
