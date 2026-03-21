interface PackageLinkEmailProps {
  agentName: string;
  packageName: string;
  token: string;
}

export function renderPackageLinkEmail({
  agentName,
  packageName,
  token,
}: PackageLinkEmailProps): { subject: string; html: string } {
  const url = `${process.env.NEXT_PUBLIC_APP_URL || "https://castbrief.com"}/p/${token}`;
  const subject = `${agentName} has shared a talent package with you`;

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
          <p style="color:#8B8D93;font-size:13px;margin:0 0 8px;">TALENT PACKAGE</p>
          <h1 style="color:#E8E3D8;font-size:22px;margin:0 0 8px;font-weight:600;">${packageName}</h1>
          <p style="color:#8B8D93;font-size:14px;margin:0 0 28px;">Shared by ${agentName}</p>
          <a href="${url}" style="display:inline-block;background:linear-gradient(135deg,#C9A84C,#B8943F);color:#0D0F14;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:15px;">
            View Package
          </a>
        </td></tr>
        <tr><td style="padding-top:24px;">
          <p style="color:#6B7280;font-size:12px;margin:0;">This link was sent via CastBrief. If you did not expect this email, you can safely ignore it.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return { subject, html };
}
