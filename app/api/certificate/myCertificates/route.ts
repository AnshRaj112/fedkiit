import { listCertificatesForEmail } from "@/lib/services/certificates";
import { body, expressError, handle, json } from "@/lib/api/express";
import { getCurrentUser, isAdmin } from "@/lib/auth/access";

/**
 * POST /api/certificate/myCertificates
 *
 * Read-only counterpart to `sendCertificatesAndEvents`, which is an admin-only
 * action that issues and emails certificates. EventsView.jsx only needs to list
 * what the signed-in user already holds, so it gets its own route rather than
 * an overload of one with side effects.
 *
 * The response key is `certandevent` because that is what the view reads.
 */
export async function POST(request: Request) {
  return handle(async () => {
    const user = await getCurrentUser();
    if (!user) return expressError(401, "Token is required");

    const requested = (await body<{ email?: string }>(request)).email?.trim();
    const email = requested || user.email;

    if (email.toLowerCase() !== user.email.toLowerCase() && !isAdmin(user)) {
      return expressError(403, "Unauthorized");
    }

    return json({
      success: true,
      message: "Certificates fetched successfully",
      certandevent: await listCertificatesForEmail(email),
    });
  });
}
