import { Resend } from 'resend';
import { WelcomeEmail } from '@/emails/welcome';

let resendClient: Resend | null = null;

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    return null;
  }

  if (!resendClient) {
    resendClient = new Resend(apiKey);
  }

  return resendClient;
}

export async function sendWelcomeEmail(to: string, userName: string) {
  const resend = getResendClient();

  if (!resend) {
    console.warn('RESEND_API_KEY is not configured, skipping welcome email');
    return;
  }

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || '纸片人男友 <onboarding@resend.dev>',
    to,
    subject: '你好呀，我是你的专属男友 💌',
    react: WelcomeEmail({ userName }),
  });
}
