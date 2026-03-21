interface UploadPromptEmailProps {
  agentName: string;
  packageName: string;
  talentName: string;
  uploadToken: string;
  message?: string;
  link?: string;
}

export function renderUploadPromptEmail({
  agentName,
  packageName,
  talentName,
  uploadToken,
  message,
  link,
}: UploadPromptEmailProps): { subject: string; html: string } {
  const url = `${process.env.NEXT_PUBLIC_APP_URL || "https://castbrief.com"}/upload/${uploadToken}`;
  const subject = `You've been requested to submit materials for ${packageName}`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#0D0F14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0D0F14;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" style="max-width:480px;">
        <tr><td style="padding-bottom:24px;">
          <span style="color:#C9A84C;font-size:18px;font-weight:bold;">CastBrief</span>
        </td></tr>
        <tr><td style="background-color:#161920;border-radius:12px;padding:32px;border:1px solid #1E2128;">
          <p style="color:#8B8D93;font-size:13px;margin:0 0 8px;">UPLOAD REQUEST</p>
          <h1 style="color:#E8E3D8;font-size:20px;margin:0 0 12px;font-weight:600;">Hi ${talentName},</h1>
          <p style="color:#8B8D93;font-size:14px;margin:0 0 24px;">Your agent ${agentName} has requested you upload your self-tape or materials for <strong style="color:#E8E3D8;">${packageName}</strong>.</p>
          ${message ? `<div style="margin:0 0 20px;padding:16px;background-color:#0D0F14;border-radius:8px;border:1px solid #1E2128;">
            <p style="color:#8B8D93;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 8px;font-weight:600;">Message from your agent</p>
            <p style="color:#E8E3D8;font-size:14px;margin:0;white-space:pre-wrap;">${message}</p>
          </div>` : ""}
          ${link ? `<div style="margin:0 0 20px;">
            <p style="color:#8B8D93;font-size:12px;margin:0 0 4px;">Reference:</p>
            <a href="${link}" style="color:#C9A84C;font-size:14px;text-decoration:underline;">${link}</a>
          </div>` : ""}
          <a href="${url}" style="display:inline-block;background:linear-gradient(135deg,#C9A84C,#B8943F);color:#0D0F14;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:15px;">
            Upload Your Materials
          </a>
          <p style="color:#6B7280;font-size:12px;margin:24px 0 0;">Supported formats: MOV, MP4, AVI (max 10GB)</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return { subject, html };
}
