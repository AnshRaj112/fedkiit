import { prisma } from "@/lib/db";
import { body, expressError, handle, json } from "@/lib/api/express";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/api/rate-limit";
import { sendMail } from "@/lib/email/mailer";
import { contactNotificationEmail } from "@/lib/email/templates";

/**
 * POST /api/form/contact
 * Port of controllers/forms/contact.js.
 *
 * The message is stored first and emailed second: the original depended on mail
 * delivery, so a Resend outage lost the enquiry outright. Rate limiting is added
 * because this endpoint is unauthenticated and was previously unthrottled.
 */
export async function POST(request: Request) {
  return handle(async () => {
    const { name, email, message } = await body<{
      name?: string;
      email?: string;
      message?: string;
    }>(request);

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return expressError(400, "Name, email and message are required");
    }

    // The Express controller only checked for presence, so "bad" passed as an
    // email address and junk rows landed in `contactus` with no way to reply.
    const address = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(address) || address.length > 254) {
      return expressError(400, "Enter a valid email address");
    }
    if (name.trim().length < 2 || name.trim().length > 80) {
      return expressError(400, "Enter your name");
    }
    if (message.trim().length < 10 || message.trim().length > 2000) {
      return expressError(400, "Please write at least a sentence");
    }

    await enforceRateLimit({ ...RATE_LIMITS.contact, subject: address });

    await prisma.contactUs.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        message: message.trim(),
        date: new Date(),
      },
    });

    const mail = contactNotificationEmail({
      name: name.trim(),
      email: email.trim(),
      message: message.trim(),
    });
    void sendMail({
      to: "fedkiit@gmail.com",
      subject: mail.subject,
      html: mail.html,
      replyTo: email.trim(),
    });

    return json(
      { success: true, message: "Message sent successfully" },
      201,
    );
  });
}
