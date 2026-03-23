interface ProjectClosedEmailProps {
  projectName: string;
  message: string;
}

export function renderProjectClosedEmail({
  projectName,
  message,
}: ProjectClosedEmailProps) {
  const subject = `Project Update: ${projectName}`;
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
      <h2 style="margin: 0 0 8px; font-size: 18px; color: #E8E3D8;">Project Update</h2>
      <p style="color: #8B8D93; font-size: 14px; margin: 0 0 24px;">
        The casting process for <strong style="color: #E8E3D8;">${projectName}</strong> has been completed.
      </p>
      ${message ? `
      <div style="background: #0D0F14; border: 1px solid #2A2D35; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <p style="color: #E8E3D8; font-size: 14px; margin: 0; white-space: pre-wrap;">${message}</p>
      </div>
      ` : ""}
      <p style="color: #8B8D93; font-size: 14px; margin: 0;">
        Thank you for your participation.
      </p>
    </div>
    <p style="text-align: center; margin-top: 24px; font-size: 12px; color: #6B7280;">
      Sent via CastingBrief
    </p>
  </div>
</body>
</html>`;

  return { subject, html };
}
