import { Resend } from "resend";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error("RESEND_API_KEY is not set");
  }
  return new Resend(key);
}

export async function sendEmail(to: string, subject: string, html: string) {
  const resend = getResend();
  const { data, error } = await resend.emails.send({
    from: "CastBrief <noreply@castbrief.com>",
    to,
    subject,
    html,
  });

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`);
  }

  return data;
}

export { getResend as resend };
