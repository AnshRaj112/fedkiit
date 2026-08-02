import { getEventByFormId } from "@/lib/services/certificates";
import { body, expressError, handle, json } from "@/lib/api/express";
import { getCurrentUser, isMember } from "@/lib/auth/access";

/**
 * POST /api/certificate/getEventByFormId
 *
 * Resolves a form id to the Event that certificates are issued against, which
 * the admin certificate tooling needs before it can read a template or send.
 * The response is the event itself - `certificateTools.js` reads `res.data.id`
 * and `res.data.certificates[0]`.
 */
export async function POST(request: Request) {
  return handle(async () => {
    const user = await getCurrentUser();
    if (!user) return expressError(401, "Token is required");
    if (!isMember(user)) return expressError(403, "Unauthorized");

    const b = await body<{ formId?: string }>(request);

    return json(await getEventByFormId(b.formId ?? ""));
  });
}
