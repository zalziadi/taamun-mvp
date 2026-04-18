/**
 * Weekly digest — sent every Saturday (Arabic week start)
 * Summarizes the user's week: reflections count, awareness snapshot, gentle nudge
 */

export interface WeeklyDigestPayload {
  userName: string;
  reflectionCount: number;
  awarenessCount: number;
  appUrl: string;
}

export function buildWeeklyDigestEmail(payload: WeeklyDigestPayload) {
  const { userName, reflectionCount, awarenessCount, appUrl } = payload;

  const subject = reflectionCount > 0
    ? `${userName}، أسبوعك في تمعّن — ${reflectionCount} تأمل`
    : `${userName}، أسبوع بدأ — هل تشاركنا تأملاً؟`;

  const weekSummary = reflectionCount >= 5
    ? "أسبوع كامل من الحضور. هذا هو التمعّن."
    : reflectionCount >= 2
      ? "بدأت تبني عادة — استمر."
      : reflectionCount === 1
        ? "تأمل واحد يكفي ليبدأ الأسبوع."
        : "لم تكتب هذا الأسبوع — لا بأس. الرحلة ليست سباقاً.";

  const html = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="margin:0;padding:0;background:#f4f1ea;font-family:'Segoe UI',Tahoma,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px;">
    <div style="padding:32px 24px;border-top:1px solid rgba(140,120,81,0.22);border-bottom:1px solid rgba(140,120,81,0.12);">
      <p style="font-size:12px;color:#8c7851;letter-spacing:0.15em;margin:0 0 8px;">أسبوعك في تمعّن</p>
      <h1 style="font-size:22px;color:#2f2619;margin:0 0 20px;">${userName}</h1>

      <div style="display:flex;gap:16px;margin-bottom:20px;">
        <div style="flex:1;padding:12px 0;border-top:1px solid rgba(140,120,81,0.15);">
          <p style="font-size:28px;color:#5a4a35;font-weight:bold;margin:0;">${reflectionCount}</p>
          <p style="font-size:11px;color:#8c7851;margin:4px 0 0;">تأمل هذا الأسبوع</p>
        </div>
        <div style="flex:1;padding:12px 0;border-top:1px solid rgba(140,120,81,0.15);">
          <p style="font-size:28px;color:#5a4a35;font-weight:bold;margin:0;">${awarenessCount}</p>
          <p style="font-size:11px;color:#8c7851;margin:4px 0 0;">لحظة حضور مسجّلة</p>
        </div>
      </div>

      <p style="font-size:15px;color:#2f2619;line-height:1.7;margin:0 0 24px;">${weekSummary}</p>

      <a href="${appUrl}/" style="display:inline-block;border:1px solid #5a4a35;color:#5a4a35;padding:12px 28px;font-weight:bold;font-size:14px;text-decoration:none;">
        افتح تمعّن
      </a>
    </div>
    <p style="text-align:center;font-size:11px;color:#8c7851;margin-top:20px;">
      تمعّن — رحلة اكتشاف المعنى بلغة القرآن · <a href="${appUrl}/account" style="color:#8c7851;">إدارة الإشعارات</a>
    </p>
  </div>
</body>
</html>`;

  const text = `${userName}، أسبوعك في تمعّن:

${reflectionCount} تأمل
${awarenessCount} لحظة حضور

${weekSummary}

افتح تمعّن: ${appUrl}/`;

  return { subject, html, text };
}
