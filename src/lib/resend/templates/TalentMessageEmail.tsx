import { getAppUrl } from "@/lib/resend/client";

interface TalentMessageEmailProps {
  agentName: string;
  packageName: string;
  talentName: string;
  messageContent: string;
}

export function renderTalentMessageEmail({
  agentName,
  packageName,
  talentName,
  messageContent,
}: TalentMessageEmailProps): { subject: string; html: string } {
  const appUrl = getAppUrl();
  const subject = `Message from ${agentName} regarding ${packageName}`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#0D0F14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0D0F14;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" style="max-width:480px;">
        <tr><td style="padding-bottom:24px;">
          <span style="color:#C9A84C;font-size:18px;font-weight:bold;">CastingBrief</span>
        </td></tr>
        <tr><td style="background-color:#161920;border-radius:12px;padding:32px;border:1px solid #1E2128;">
          <p style="color:#8B8D93;font-size:13px;margin:0 0 8px;">MESSAGE</p>
          <h1 style="color:#E8E3D8;font-size:20px;margin:0 0 12px;font-weight:600;">Hi ${talentName},</h1>
          <p style="color:#8B8D93;font-size:14px;margin:0 0 24px;">You have a new message from <strong style="color:#E8E3D8;">${agentName}</strong> regarding <strong style="color:#E8E3D8;">${packageName}</strong>.</p>
          <div style="margin:0 0 24px;padding:16px;background-color:#0D0F14;border-radius:8px;border:1px solid #1E2128;">
            <p style="color:#E8E3D8;font-size:14px;margin:0;white-space:pre-wrap;">${messageContent}</p>
          </div>
          <a href="${appUrl}/talent/profile" style="display:inline-block;background:linear-gradient(135deg,#C9A84C,#B8943F);color:#0D0F14;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:15px;">
            View &amp; Respond
          </a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return { subject, html };
}
