import { Resend } from "resend";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error("RESEND_API_KEY is not set");
  }
  return new Resend(key);
}

export function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "https://castingbrief.com";
}

export async function sendEmail(to: string, subject: string, html: string) {
  const resend = getResend();
  const { data, error } = await resend.emails.send({
    from: "CastingBrief <noreply@castingbrief.com>",
    to,
    subject,
    html,
  });

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`);
  }

  return data;
}
