import { prisma } from "@/lib/db";
import { handle, json } from "@/lib/api/express";

/**
 * GET /api/form/getAllForms[?id=<formId>]
 *
 * Port of FED-Backend/controllers/forms/getForm.js. The response shape
 * (`{ success, message, events }`) is preserved because Event.jsx reads
 * `response.data.events` and then `event.info.*` / `event.sections`.
 */
export async function GET(request: Request) {
  return handle(async () => {
    const id = new URL(request.url).searchParams.get("id");

    if (id) {
      // Guard the id: Prisma throws on a malformed ObjectId, where the Express
      // version simply returned null because Mongo tolerated it.
      const forms = /^[a-f\d]{24}$/i.test(id)
        ? await prisma.form.findUnique({ where: { id } })
        : null;

      return json({
        success: true,
        message: "All forms fetched successfully",
        events: forms,
      });
    }

    const forms = await prisma.form.findMany({});

    return json({
      success: true,
      message: "All forms fetched successfully",
      events: forms,
    });
  });
}
