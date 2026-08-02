import { createOrganisationEvent } from "@/lib/services/certificates";
import { body, expressError, handle, json } from "@/lib/api/express";
import { getCurrentUser, isMember } from "@/lib/auth/access";

/**
 * POST /api/certificate/createOrganisationEvent
 *
 * Companion to `getEventByFormId`: called when a form has no Event yet, so a
 * certificate template can be attached to it. Returns the event directly, in
 * the same shape as `getEventByFormId`.
 */
export async function POST(request: Request) {
  return handle(async () => {
    const user = await getCurrentUser();
    if (!user) return expressError(401, "Token is required");
    if (!isMember(user)) return expressError(403, "Unauthorized");

    const b = await body<{
      name?: string;
      description?: string;
      organisationId?: string;
      formId?: string;
    }>(request);

    return json(
      await createOrganisationEvent({
        name: b.name ?? "",
        description: b.description ?? "",
        organisationId: b.organisationId ?? "",
        formId: b.formId,
      }),
    );
  });
}
