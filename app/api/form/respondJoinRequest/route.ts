import { respondJoinRequest } from "@/lib/services/team-invites";
import { isApiError } from "@/lib/api/errors";

/**
 * GET /api/form/respondJoinRequest?id=&action=accept|reject
 * Port of controllers/registration/respondJoinRequest.js.
 *
 * Public by design: the team leader clicks this straight from an email, with no
 * session. The unguessable request id plus single-use semantics are what stand
 * in for authentication, matching the original.
 *
 * Responds with HTML in every case, including errors. A browser lands here
 * directly, so the shared `handle()` JSON envelope would have shown the leader a
 * raw `{"success":false,…}` blob instead of a page.
 */

function page(heading: string, message: string, accent: string): Response {
  const escape = (v: string) =>
    v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>Team request · FED KIIT</title></head>
<body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#1c1c1c;color:#fff;font-family:'Open Sans',Arial,sans-serif;">
<div style="max-width:420px;padding:40px;text-align:center;">
  <div style="font-size:20px;font-weight:700;background:linear-gradient(260deg,#ffbe0b,#f42b03);-webkit-background-clip:text;background-clip:text;color:transparent;">FED KIIT</div>
  <h1 style="margin:20px 0 10px;font-size:22px;color:${accent};">${escape(heading)}</h1>
  <p style="margin:0 0 26px;font-size:15px;line-height:1.6;color:#ccc;">${escape(message)}</p>
  <a href="/Events" style="display:inline-block;padding:12px 24px;border-radius:8px;background:#ff8a00;color:#1c1c1c;font-weight:600;text-decoration:none;">Back to events</a>
</div></body></html>`;

  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;

  try {
    const result = await respondJoinRequest({
      id: params.get("id") ?? "",
      action: params.get("action") ?? "",
    });

    return page(
      result.status.replace(/_/g, " "),
      result.message,
      result.status === "ACCEPTED" ? "#4caf50" : "#e74c3c",
    );
  } catch (error) {
    if (isApiError(error)) {
      return page("Request unavailable", error.message, "#e74c3c");
    }
    console.error("[respondJoinRequest]", error);
    return page(
      "Something went wrong",
      "We could not process that request. Please try again, or email fedkiit@gmail.com.",
      "#e74c3c",
    );
  }
}
