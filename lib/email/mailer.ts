import "server-only";

import { Resend } from "resend";

import { getEnv } from "@/lib/env";

/**
 * Transactional email via Resend, with the two-domain fallback the Express
 * backend used: try the primary sender, fall back to the secondary if it fails.
 *
 * Clients are created lazily and memoised — constructing them at module scope
 * (as `nodeMailer.js` did) throws during build when the keys are absent.
 */

let primary: Resend | null | undefined;
let secondary: Resend | null | undefined;

function primaryClient(): Resend | null {
  if (primary === undefined) {
    const key = getEnv().RESEND_API_KEY;
    primary = key ? new Resend(key) : null;
  }
  return primary;
}

function secondaryClient(): Resend | null {
  if (secondary === undefined) {
    const key = getEnv().RESEND_API_KEY_2;
    secondary = key ? new Resend(key) : null;
  }
  return secondary;
}

export type MailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
};

export type MailResult =
  | { sent: true; id: string; via: "primary" | "secondary" }
  | { sent: false; reason: string };

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Sends an email. Never throws — returns a result the caller can decide about.
 *
 * The old controllers let a mail failure reject the whole request, so a Resend
 * outage turned "your account was created" into a 500 even though the account
 * existed. Callers here choose whether a failure is fatal.
 */
export async function sendMail(input: MailInput): Promise<MailResult> {
  const env = getEnv();
  const payload = {
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text ?? stripHtml(input.html),
    replyTo: input.replyTo ?? "fedkiit@gmail.com",
  };

  const attempts: Array<{
    client: Resend | null;
    from: string | undefined;
    label: "primary" | "secondary";
  }> = [
    { client: primaryClient(), from: env.EMAIL_FROM, label: "primary" },
    { client: secondaryClient(), from: env.EMAIL_FROM_2, label: "secondary" },
  ];

  const failures: string[] = [];

  for (const { client, from, label } of attempts) {
    if (!client || !from) continue;
    try {
      const { data, error } = await client.emails.send({ ...payload, from });
      if (!error && data?.id) {
        return { sent: true, id: data.id, via: label };
      }
      failures.push(`${label}: ${error?.message ?? "unknown error"}`);
    } catch (error) {
      failures.push(
        `${label}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  const reason =
    failures.length > 0
      ? failures.join("; ")
      : "No Resend API key configured (set RESEND_API_KEY)";

  console.error("[email] delivery failed —", reason);
  return { sent: false, reason };
}
