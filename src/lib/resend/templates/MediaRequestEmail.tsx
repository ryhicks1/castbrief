import { getAppUrl } from "@/lib/resend/client";

interface MediaRequestEmailProps {
  clientName: string;
  packageName: string;
  talentNames: string[];
  token: string;
}

export function renderMediaRequestEmail({
  clientName,
  packageName,
  talentNames,
  token,
}: MediaRequestEmailProps): { subject: string; html: string } {
  const url = `${getAppUrl()}/p/${token}`;
  const subject = `Media requested for ${packageName}`;

  const talentList = talentNames
    .map((name) => `<li style="color:#E8E3D8;font-size:14px;padding:4px 0;">${name}</li>`)
    .join("");

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
          <p style="color:#8B8D93;font-size:13px;margin:0 0 8px;">MEDIA REQUEST</p>
          <h1 style="color:#E8E3D8;font-size:20px;margin:0 0 12px;font-weight:600;">${packageName}</h1>
          <p style="color:#8B8D93;font-size:14px;margin:0 0 20px;">${clientName} has requested media for ${talentNames.length} talent:</p>
          <ul style="margin:0 0 24px;padding-left:20px;">${talentList}</ul>
          <a href="${url}" style="display:inline-block;background:linear-gradient(135deg,#C9A84C,#B8943F);color:#0D0F14;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:15px;">
            View Package
          </a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return { subject, html };
}
