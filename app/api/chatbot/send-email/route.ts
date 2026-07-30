import { prisma } from "@/lib/db";
import { body, expressError, handle, json } from "@/lib/api/express";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/api/rate-limit";
import { getCurrentUser } from "@/lib/auth/access";
import { sendMail } from "@/lib/email/mailer";
import { contactNotificationEmail } from "@/lib/email/templates";

/**
 * POST /api/chatbot/send-email
 * Port of controllers/chatbot/emailController.js.
 *
 * Reached when the assistant decides a question needs a human, so the message
 * goes to the club inbox. It is stored in `contactus` alongside normal contact
 * submissions, because the original only emailed — meaning any enquiry raised
 * through the chatbot was lost if mail delivery failed.
 *
 * The recipient is fixed to the club address; only the body comes from the
 * request, so this cannot be used to send mail to arbitrary addresses.
 */
export async function POST(request: Request) {
  return handle(async () => {
    const b = await body<{
      content?: string;
      senderName?: string | null;
      senderEmail?: string | null;
    }>(request);

    const content = b.content?.trim();
    if (!content) return expressError(400, "Message content is required");
    if (content.length > 5000) {
      return expressError(413, "That message is too long");
    }

    // Prefer the signed-in identity over anything supplied in the body.
    const user = await getCurrentUser();
    const name = user?.name ?? b.senderName?.trim() ?? "Chatbot visitor";
    const email = user?.email ?? b.senderEmail?.trim().toLowerCase() ?? "";

    await enforceRateLimit({
      ...RATE_LIMITS.contact,
      subject: email || "anonymous",
    });

    if (!email) {
      return expressError(400, "An email address is required to reply to you");
    }

    await prisma.contactUs.create({
      data: {
        name,
        email,
        message: `[via chatbot] ${content}`,
        date: new Date(),
      },
    });

    const mail = contactNotificationEmail({ name, email, message: content });
    const result = await sendMail({
      to: "fedkiit@gmail.com",
      subject: `[Chatbot] ${mail.subject}`,
      html: mail.html,
      replyTo: email,
    });

    return json({
      success: true,
      message: result.sent
        ? "Your message has been sent to the FED team."
        : "Your message was received and the team will see it shortly.",
    });
  });
}
