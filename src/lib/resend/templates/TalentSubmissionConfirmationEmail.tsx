interface TalentSubmissionConfirmationEmailProps {
  talentName: string;
  packageName: string;
}

export function renderTalentSubmissionConfirmationEmail({
  talentName,
  packageName,
}: TalentSubmissionConfirmationEmailProps): { subject: string; html: string } {
  const subject = `Your submission for ${packageName} has been received`;

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
          <p style="color:#8B8D93;font-size:13px;margin:0 0 8px;">SUBMISSION CONFIRMED</p>
          <h1 style="color:#E8E3D8;font-size:20px;margin:0 0 12px;font-weight:600;">Hi ${talentName},</h1>
          <p style="color:#8B8D93;font-size:14px;margin:0 0 24px;">Your submission for <strong style="color:#E8E3D8;">${packageName}</strong> has been received. Your agent has been notified.</p>
          <div style="text-align:center;padding:16px;background-color:#0D0F14;border-radius:8px;border:1px solid #1E2128;">
            <span style="color:#4ADE80;font-size:28px;">&#10003;</span>
            <p style="color:#4ADE80;font-size:14px;margin:8px 0 0;font-weight:600;">All done!</p>
          </div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return { subject, html };
}
