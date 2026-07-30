import nodemailer from "nodemailer";

let cachedTransporter = null;

const hasSmtpConfig = () => process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;

export const getMailer = () => {
  if (!hasSmtpConfig()) return null;
  if (!cachedTransporter) {
    cachedTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: String(process.env.SMTP_SECURE || "false") === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return cachedTransporter;
};

export const sendMail = async ({ to, subject, html }) => {
  const transporter = getMailer();
  if (!transporter) return { skipped: true };

  return transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    html,
  });
};

