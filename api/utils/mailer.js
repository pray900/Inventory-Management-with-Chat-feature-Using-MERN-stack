const nodemailer = require("nodemailer");
const configs = require("./../configs");

let transporter = null;
if (configs.SMTP_HOST) {
  transporter = nodemailer.createTransport({
    host: configs.SMTP_HOST,
    port: configs.SMTP_PORT,
    secure: configs.SMTP_PORT === 465,
    auth: {
      user: configs.SMTP_USER,
      pass: configs.SMTP_PASS,
    },
  });
}

// Until SMTP_HOST is configured in .env, this logs what would have been
// sent instead of throwing — lets the rest of the feature (token
// generation, expiry, reset flow) be built and tested before real
// credentials exist.
async function sendMail({ to, subject, html }) {
  if (!transporter) {
    console.warn(
      "[mailer] SMTP not configured — email not sent. Would have sent:",
    );
    console.warn(
      `[mailer] to: ${to}\n[mailer] subject: ${subject}\n[mailer] body: ${html}`,
    );
    return;
  }
  await transporter.sendMail({
    from: configs.SMTP_FROM,
    to,
    subject,
    html,
  });
}

module.exports = { sendMail };
