import "server-only";

import { SITE } from "@/lib/site";
import { SITE_URL } from "@/lib/seo/metadata";

/**
 * Transactional email templates.
 *
 * Replaces `FED-Backend/emailTemplates/*.html`, which were the unedited generic
 * grey-and-blue defaults with no FED branding at all (flagged in design.md).
 * These carry the brand gradient header and the site's orange accent.
 *
 * Written as table-based HTML with inline styles: that is still the only markup
 * every mail client renders consistently. Content sits on a light card rather
 * than the site's dark charcoal, because dark backgrounds get inverted
 * unpredictably by Outlook and Gmail's own dark modes.
 */

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

type ShellInput = {
  heading: string;
  body: string;
  preheader: string;
  cta?: { label: string; href: string };
};

function shell({ heading, body, preheader, cta }: ShellInput): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(heading)}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Open Sans',Segoe UI,Arial,sans-serif;">
  <!-- Inbox preview text -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">

          <!-- Brand header: the FED amber-to-red gradient -->
          <tr>
            <td style="background:#1c1c1c;background-image:linear-gradient(260deg,#ffbe0b -29.7%,#f42b03 128.34%);padding:28px 32px;">
              <p style="margin:0;font-family:Poppins,Segoe UI,Arial,sans-serif;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:0.5px;">
                FED KIIT
              </p>
              <p style="margin:4px 0 0;font-size:12px;color:rgba(255,255,255,0.85);">
                Federation of Entrepreneurship Development
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:32px;">
              <h1 style="margin:0 0 16px;font-family:Poppins,Segoe UI,Arial,sans-serif;font-size:20px;font-weight:600;color:#1c1c1c;">
                ${escapeHtml(heading)}
              </h1>
              ${body}
              ${
                cta
                  ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 8px;">
                       <tr>
                         <td style="border-radius:8px;background:#ff8a00;">
                           <a href="${cta.href}" style="display:inline-block;padding:13px 26px;font-family:Poppins,Segoe UI,Arial,sans-serif;font-size:15px;font-weight:600;color:#1c1c1c;text-decoration:none;border-radius:8px;">
                             ${escapeHtml(cta.label)}
                           </a>
                         </td>
                       </tr>
                     </table>`
                  : ""
              }
            </td>
          </tr>

          <tr>
            <td style="padding:20px 32px 28px;border-top:1px solid #ececee;">
              <p style="margin:0 0 6px;font-size:12px;color:#6b7280;">
                Sent by ${escapeHtml(SITE.legalName)}, ${escapeHtml(SITE.address.locality)}, ${escapeHtml(SITE.address.region)}, India.
              </p>
              <p style="margin:0;font-size:12px;color:#6b7280;">
                <a href="${SITE_URL}" style="color:#f97507;text-decoration:none;">fedkiit.com</a>
                &nbsp;·&nbsp; Questions? Reply to this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

const P = "margin:0 0 14px;font-size:15px;line-height:1.6;color:#3f3f46;";

/** OTP challenge, used for both signup verification and password reset. */
export function otpEmail(input: {
  otp: string;
  validityMinutes: number;
  purpose: "verify" | "reset";
}): { subject: string; html: string } {
  const isReset = input.purpose === "reset";
  const heading = isReset ? "Reset your password" : "Verify your email address";

  const body = `
    <p style="${P}">
      ${
        isReset
          ? "Use the code below to reset the password on your FED KIIT account."
          : "Welcome to FED KIIT. Use the code below to finish creating your account."
      }
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
      <tr>
        <td style="background:#faf7f2;border:1px dashed #ff8a00;border-radius:12px;padding:18px 32px;">
          <span style="font-family:'Courier New',monospace;font-size:34px;font-weight:700;letter-spacing:10px;color:#1c1c1c;">
            ${escapeHtml(input.otp)}
          </span>
        </td>
      </tr>
    </table>
    <p style="${P}">
      This code expires in <strong>${input.validityMinutes} minutes</strong>.
    </p>
    <p style="margin:0;font-size:13px;line-height:1.6;color:#6b7280;">
      If you did not request this, you can safely ignore this email — nobody can
      access your account without the code.
    </p>`;

  return {
    subject: isReset
      ? "Your FED KIIT password reset code"
      : "Your FED KIIT verification code",
    html: shell({
      heading,
      body,
      preheader: `Your code is ${input.otp}. It expires in ${input.validityMinutes} minutes.`,
    }),
  };
}

/** Sent once an account exists. */
export function welcomeEmail(input: { name: string }): {
  subject: string;
  html: string;
} {
  const body = `
    <p style="${P}">Hi ${escapeHtml(input.name)},</p>
    <p style="${P}">
      Your FED KIIT account is ready. You can now register for events, track your
      registrations and download certificates from your profile.
    </p>
    <p style="${P}">
      FED is the student entrepreneurship body of KIIT TBI — we run events,
      workshops and competitions, and help student founders get their ideas off
      the ground.
    </p>`;

  return {
    subject: "Welcome to FED KIIT",
    html: shell({
      heading: "Your account is ready",
      body,
      preheader: "Your FED KIIT account has been created.",
      cta: { label: "Browse events", href: `${SITE_URL}/events` },
    }),
  };
}

/** Registration confirmation for an event. */
export function registrationEmail(input: {
  name: string;
  eventTitle: string;
  eventDate: string;
  teamName?: string | null;
  teamCode?: string | null;
}): { subject: string; html: string } {
  const rows: string[] = [
    `<tr><td style="padding:8px 0;font-size:14px;color:#6b7280;width:130px;">Event</td>
     <td style="padding:8px 0;font-size:14px;color:#1c1c1c;font-weight:600;">${escapeHtml(input.eventTitle)}</td></tr>`,
  ];

  if (input.eventDate) {
    rows.push(
      `<tr><td style="padding:8px 0;font-size:14px;color:#6b7280;">Date</td>
       <td style="padding:8px 0;font-size:14px;color:#1c1c1c;">${escapeHtml(input.eventDate)}</td></tr>`,
    );
  }
  if (input.teamName) {
    rows.push(
      `<tr><td style="padding:8px 0;font-size:14px;color:#6b7280;">Team</td>
       <td style="padding:8px 0;font-size:14px;color:#1c1c1c;">${escapeHtml(input.teamName)}</td></tr>`,
    );
  }
  if (input.teamCode) {
    rows.push(
      `<tr><td style="padding:8px 0;font-size:14px;color:#6b7280;">Team code</td>
       <td style="padding:8px 0;font-size:14px;color:#1c1c1c;font-family:'Courier New',monospace;font-weight:700;">${escapeHtml(input.teamCode)}</td></tr>`,
    );
  }

  const body = `
    <p style="${P}">Hi ${escapeHtml(input.name)}, you're registered.</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:20px 0;border-top:1px solid #ececee;border-bottom:1px solid #ececee;">
      ${rows.join("")}
    </table>
    ${
      input.teamCode
        ? `<p style="${P}">Share the team code with your teammates so they can join your team.</p>`
        : ""
    }`;

  return {
    subject: `Registered: ${input.eventTitle}`,
    html: shell({
      heading: "Registration confirmed",
      body,
      preheader: `You're registered for ${input.eventTitle}.`,
      cta: { label: "View your registrations", href: `${SITE_URL}/profile/events` },
    }),
  };
}

/** Internal notification for the contact form. */
export function contactNotificationEmail(input: {
  name: string;
  email: string;
  message: string;
}): { subject: string; html: string } {
  const body = `
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:0 0 18px;">
      <tr><td style="padding:8px 0;font-size:14px;color:#6b7280;width:90px;">From</td>
          <td style="padding:8px 0;font-size:14px;color:#1c1c1c;font-weight:600;">${escapeHtml(input.name)}</td></tr>
      <tr><td style="padding:8px 0;font-size:14px;color:#6b7280;">Email</td>
          <td style="padding:8px 0;font-size:14px;"><a href="mailto:${escapeHtml(input.email)}" style="color:#f97507;">${escapeHtml(input.email)}</a></td></tr>
    </table>
    <div style="background:#faf7f2;border-left:3px solid #ff8a00;border-radius:6px;padding:14px 16px;">
      <p style="margin:0;font-size:15px;line-height:1.6;color:#3f3f46;white-space:pre-wrap;">${escapeHtml(input.message)}</p>
    </div>`;

  return {
    subject: `New contact form message from ${input.name}`,
    html: shell({
      heading: "New enquiry from the website",
      body,
      preheader: `${input.name}: ${input.message.slice(0, 80)}`,
    }),
  };
}

/**
 * Sent to someone a team leader has removed.
 *
 * Copy follows emailTemplates/removedMember.html: the point is to make clear the
 * person is still registered for the event and can join or start another team.
 */
export function removedMemberEmail(input: {
  teamName: string;
  eventName: string;
}): string {
  const body = `
    <p style="${P}">Hi there,</p>
    <p style="${P}">
      You have been removed from the team <strong>${escapeHtml(input.teamName)}</strong>
      for <strong>${escapeHtml(input.eventName)}</strong>.
    </p>
    <p style="${P}">
      But don't worry — your registration for the event is still active. You can:
    </p>
    <p style="${P}">
      • Browse and join other available teams<br />
      • Create your own brand new team
    </p>
    <p style="${P}">
      Head over to the Team Management page to explore your options and get back
      in the action.
    </p>`;

  return shell({
    heading: "Team Membership Update",
    body,
    preheader: `You have been removed from ${input.teamName}.`,
  });
}
