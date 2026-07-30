import "server-only";

import { prisma } from "@/lib/db";
import { getEnv } from "@/lib/env";
import { sendMail } from "@/lib/email/mailer";
import { contactNotificationEmail } from "@/lib/email/templates";
import type { ContactInput } from "@/lib/validation/auth";

/**
 * Contact form submissions, ported from `controllers/forms/contact.js`.
 *
 * The message is persisted first and emailed second: the old flow depended on
 * mail delivery, so a Resend failure meant the enquiry was lost entirely. Here
 * the row is the record of truth and the notification is best-effort.
 */
export async function submitContactMessage(
  input: ContactInput,
): Promise<{ id: string; notified: boolean }> {
  const record = await prisma.contactUs.create({
    data: {
      name: input.name,
      email: input.email,
      message: input.message,
      date: new Date(),
    },
    select: { id: true },
  });

  const inbox = getEnv().EMAIL_FROM_2 ?? getEnv().EMAIL_FROM;
  let notified = false;

  if (inbox) {
    const mail = contactNotificationEmail(input);
    const result = await sendMail({
      to: "fedkiit@gmail.com",
      subject: mail.subject,
      html: mail.html,
      replyTo: input.email,
    });
    notified = result.sent;
  }

  return { id: record.id, notified };
}
