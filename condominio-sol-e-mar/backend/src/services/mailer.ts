// Simple mailer using nodemailer (install nodemailer when needed)
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  // configure with environment variables in production
  host: process.env.SMTP_HOST || 'smtp.example.com',
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER || 'user',
    pass: process.env.SMTP_PASS || 'pass'
  }
})

export async function sendMail(opts: { to: string; subject: string; text?: string; html?: string }) {
  const { to, subject, text, html } = opts
  return transporter.sendMail({ from: process.env.SMTP_FROM || 'noreply@example.com', to, subject, text, html })
}
