/**
 * Sends transactional email over SMTP (Gmail by default — see env.smtp).
 * When SMTP_USER/SMTP_PASS aren't configured, falls back to logging the
 * message to stdout so links are still visible during local development.
 */
import nodemailer, { Transporter } from "nodemailer";
import { logger } from "../utils/logger";
import { env } from "../config/env";

let transporter: Transporter | null = null;

if (env.smtp.user && env.smtp.pass) {
  transporter = nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.port === 465,
    auth: { user: env.smtp.user, pass: env.smtp.pass },
  });
} else {
  logger.warn("[mailer] SMTP_USER/SMTP_PASS not set — emails will be logged instead of sent");
}

async function send(to: string, subject: string, text: string, html: string): Promise<void> {
  if (!transporter) {
    console.log(`[mailer] ${subject} -> ${to}: ${text}`);
    return;
  }

  await transporter.sendMail({ from: env.smtp.from, to, subject, text, html });
}

export function sendVerificationEmail(to: string, verifyUrl: string): void {
  logger.info(`[mailer] Verification email to ${to}`);

  send(
    to,
    "Verify your email — Stayly",
    `Welcome to Stayly! Verify your email: ${verifyUrl} (expires in 24 hours)`,
    `<p>Welcome to Stayly! Click below to verify your email address.</p>
     <p><a href="${verifyUrl}">Verify my email</a></p>
     <p style="color:#71717a;font-size:13px">This link expires in 24 hours. If you didn't create an account, you can ignore this email.</p>`
  ).catch((err) => logger.error(`[mailer] Failed to send verification email to ${to}`, err));
}

export function sendPasswordResetEmail(to: string, resetUrl: string): void {
  logger.info(`[mailer] Password reset email to ${to}`);

  send(
    to,
    "Reset your password — Stayly",
    `Reset your password: ${resetUrl} (expires in 1 hour)`,
    `<p>We received a request to reset your password. Click below to choose a new one.</p>
     <p><a href="${resetUrl}">Reset my password</a></p>
     <p style="color:#71717a;font-size:13px">This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>`
  ).catch((err) => logger.error(`[mailer] Failed to send password reset email to ${to}`, err));
}

export function sendBusinessApprovalEmail(to: string, approved: boolean): void {
  logger.info(`[mailer] Business ${approved ? "approval" : "rejection"} email to ${to}`);

  const subject = approved
    ? "Your business account is approved — Stayly"
    : "Update on your business registration — Stayly";
  const text = approved
    ? "Good news — your business account has been approved. You can now log in."
    : "Your business registration wasn't approved. Contact support if you have questions.";

  send(
    to,
    subject,
    text,
    `<p>${text}</p>`
  ).catch((err) => logger.error(`[mailer] Failed to send business approval email to ${to}`, err));
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function sendContactMessage(input: {
  name: string;
  email: string;
  phone?: string;
  topic: string;
  message: string;
}): void {
  const to = env.contactEmail;
  if (!to) {
    console.log(`[mailer] Contact message (no CONTACT_EMAIL/SMTP_USER set) from ${input.email}: ${input.message}`);
    return;
  }

  logger.info(`[mailer] Contact message from ${input.email} (${input.topic})`);

  const text = `From: ${input.name} <${input.email}>\nPhone: ${input.phone || "—"}\nTopic: ${input.topic}\n\n${input.message}`;
  const html = `<p><strong>From:</strong> ${escapeHtml(input.name)} &lt;${escapeHtml(input.email)}&gt;</p>
     <p><strong>Phone:</strong> ${escapeHtml(input.phone || "—")}</p>
     <p><strong>Topic:</strong> ${escapeHtml(input.topic)}</p>
     <p style="white-space:pre-wrap">${escapeHtml(input.message)}</p>`;

  if (!transporter) {
    console.log(`[mailer] Contact message -> ${to}: ${text}`);
    return;
  }

  transporter
    .sendMail({
      from: env.smtp.from,
      to,
      replyTo: input.email,
      subject: `[Stayly contact] ${input.topic} — ${input.name}`,
      text,
      html,
    })
    .catch((err) => logger.error(`[mailer] Failed to send contact message from ${input.email}`, err));
}
