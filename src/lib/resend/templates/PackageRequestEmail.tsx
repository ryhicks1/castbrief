import { getAppUrl } from "@/lib/resend/client";

interface PackageRequestEmailProps {
  clientName: string;
  projectName: string;
  roleName: string | null;
  brief: string | null;
  formUrl?: string;
}

export function renderPackageRequestEmail({
  clientName,
  projectName,
  roleName,
  brief,
  formUrl,
}: PackageRequestEmailProps) {
  const appUrl = getAppUrl();
  const subject = `Package Request: ${projectName}${roleName ? ` — ${roleName}` : ""}`;
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0F0F12; color: #E8E3D8; padding: 40px 20px;">
  <div style="max-width: 480px; margin: 0 auto;">
    <div style="text-align: center; margin-bottom: 32px;">
      <span style="font-size: 24px; font-weight: bold; color: #B8964C;">CastingBrief</span>
    </div>
    <div style="background: #161920; border: 1px solid #1E2128; border-radius: 12px; padding: 32px;">
      <h2 style="margin: 0 0 8px; font-size: 18px; color: #E8E3D8;">New Package Request</h2>
      <p style="color: #8B8D93; font-size: 14px; margin: 0 0 24px;">
        <strong style="color: #E8E3D8;">${clientName}</strong> is requesting a talent package.
      </p>
      <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #8B8D93; width: 100px;">Project</td>
          <td style="padding: 8px 0; color: #E8E3D8; font-weight: 500;">${projectName}</td>
        </tr>
        ${roleName ? `
        <tr>
          <td style="padding: 8px 0; color: #8B8D93;">Role</td>
          <td style="padding: 8px 0; color: #E8E3D8; font-weight: 500;">${roleName}</td>
        </tr>
        ` : ""}
        ${brief ? `
        <tr>
          <td style="padding: 8px 0; color: #8B8D93; vertical-align: top;">Brief</td>
          <td style="padding: 8px 0; color: #E8E3D8;">${brief}</td>
        </tr>
        ` : ""}
        ${formUrl ? `
        <tr>
          <td style="padding: 8px 0; color: #8B8D93; vertical-align: top;">Form to complete</td>
          <td style="padding: 8px 0;"><a href="${formUrl}" style="color: #C9A84C; text-decoration: underline; font-size: 14px;">${formUrl}</a></td>
        </tr>
        ` : ""}
      </table>
      <div style="margin-top: 24px; text-align: center;">
        <a href="${appUrl}/agent/dashboard" style="display: inline-block; padding: 12px 32px; background: linear-gradient(135deg, #C9A84C, #B8943F); color: #0D0F14; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
          View in Dashboard
        </a>
      </div>
    </div>
    <p style="text-align: center; margin-top: 24px; font-size: 12px; color: #6B7280;">
      Sent via CastingBrief
    </p>
  </div>
</body>
</html>`;

  return { subject, html };
}
