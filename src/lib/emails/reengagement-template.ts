/**
 * Re-engagement email — sent to users inactive 3+ days
 * Gentle, no guilt — respects the user's time
 */

export interface ReengagementPayload {
  userName: string;
  daysSinceLastReflection: number;
  appUrl: string;
}

export function buildReengagementEmail(payload: ReengagementPayload) {
  const { userName, daysSinceLastReflection, appUrl } = payload;

  const subject = daysSinceLastReflection >= 14
    ? `${userName}، تمعّن ينتظرك`
    : `${userName}، لحظة صغيرة؟`;

  const message = daysSinceLastReflection >= 14
    ? "مضى أسبوعان. لا عتاب — الرحلة ليست سباقاً. حين تعود، تمعّن سيعرف أين وقفت."
    : daysSinceLastReflection >= 7
      ? "أسبوع كامل بدون تأمل. هذا طبيعي — لكن قلبك يسأل عن الآية التي توقفت عندها."
      : "ثلاثة أيام. هذا لا شيء — الحياة تحدث. خمس دقائق اليوم تكفي.";

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
      <p style="font-size:12px;color:#8c7851;letter-spacing:0.15em;margin:0 0 16px;">تمعّن</p>

      <p style="font-family:serif;font-size:20px;color:#2f2619;line-height:1.8;margin:0 0 24px;">
        ${message}
      </p>

      <p style="font-size:13px;color:#8c7851;margin:0 0 24px;">
        — ${userName}
      </p>

      <a href="${appUrl}/" style="display:inline-block;border:1px solid #5a4a35;color:#5a4a35;padding:12px 28px;font-weight:bold;font-size:14px;text-decoration:none;">
        افتح آية اليوم
      </a>
    </div>
    <p style="text-align:center;font-size:11px;color:#8c7851;margin-top:20px;">
      لا نرسل كثيراً — فقط حين نحسّ أنك تحتاج التذكير · <a href="${appUrl}/account" style="color:#8c7851;">إدارة الإشعارات</a>
    </p>
  </div>
</body>
</html>`;

  const text = `${message}

— ${userName}

افتح آية اليوم: ${appUrl}/`;

  return { subject, html, text };
}
