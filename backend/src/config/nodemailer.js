import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isSMTPConfigured =
  process.env.SMTP_HOST &&
  process.env.SMTP_PORT &&
  process.env.SMTP_USER &&
  process.env.SMTP_PASS &&
  process.env.USE_MOCK_SMTP !== 'true';

let transporter = null;

if (isSMTPConfigured) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: parseInt(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  console.log('Nodemailer SMTP transporter initialized.');
} else {
  console.log('SMTP credentials missing or USE_MOCK_SMTP is true. Setting up mock mail logger...');
  
  // Set up local file log directory for emails
  const logsDir = path.join(__dirname, '..', '..', 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  transporter = {
    sendMail: async (mailOptions) => {
      const emailContent = `
========================================
EMAIL SENT AT: ${new Date().toISOString()}
FROM: ${mailOptions.from || process.env.SMTP_FROM || 'noreply@eventsphere.com'}
TO: ${mailOptions.to}
SUBJECT: ${mailOptions.subject}
----------------------------------------
HTML CONTENT:
${mailOptions.html}
----------------------------------------
TEXT CONTENT:
${mailOptions.text || 'No plain text provided'}
========================================
`;
      const emailLogPath = path.join(logsDir, 'emails.txt');
      fs.appendFileSync(emailLogPath, emailContent);
      
      console.log(`[MOCK EMAIL] Email sent to ${mailOptions.to}. Subject: "${mailOptions.subject}". Logged in backend/logs/emails.txt`);
      
      return {
        messageId: `mock_mail_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        response: '250 OK (Mock logged)',
      };
    }
  };
}

/**
 * Send an email using the active transporter
 * @param {object} options - { to, subject, html, text }
 */
export const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const fromAddress = process.env.SMTP_FROM || 'noreply@eventsphere.com';
    const info = await transporter.sendMail({
      from: `"EventSphere" <${fromAddress}>`,
      to,
      subject,
      text,
      html,
    });
    return info;
  } catch (error) {
    console.error('Failed to send email:', error);
    // Do not throw to avoid crashing booking flows, just return false
    return false;
  }
};

export default transporter;
