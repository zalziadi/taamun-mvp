/**
 * قالب إيميل تنبيه — يُرسل قبل انتهاء الاشتراك بأسبوع
 */

export interface ExpiryWarningPayload {
  userName: string;
  daysLeft: number;
  tier: string;
  appUrl: string;
}

export function buildExpiryWarningEmail(payload: ExpiryWarningPayload) {
  const { userName, daysLeft, tier, appUrl } = payload;

  const tierLabel =
    tier === "yearly" || tier === "vip"
      ? "الباقة السنوية"
      : tier === "eid"
        ? "باقة العيدية"
        : "الباقة الشهرية";

  const subject = `⏳ اشتراكك في تمعّن ينتهي خلال ${daysLeft} أيام`;

  const html = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Segoe UI',Tahoma,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#111111;border-radius:16px;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="padding:32px 32px 24px;text-align:center;background:linear-gradient(135deg,#2e1a1a 0%,#3e2116 100%);">
              <div style="font-size:32px;margin-bottom:8px;">⏳</div>
              <h1 style="margin:0;font-size:22px;font-weight:700;color:#e8d5b7;letter-spacing:0.5px;">
                ${userName}، اشتراكك ينتهي قريباً
              </h1>
              <p style="margin:8px 0 0;font-size:14px;color:#aa8866;">
                باقي ${daysLeft} أيام على انتهاء ${tierLabel}
              </p>
            </td>
          </tr>

          <!-- Message -->
          <tr>
            <td style="padding:28px 32px;">
              <p style="margin:0;font-size:15px;color:#ccbbaa;line-height:1.8;text-align:center;">
                رحلتك مع تمعّن ما خلصت بعد.<br/>
                جدّد اشتراكك عشان تكمّل مسيرة اكتشاف المعنى.
              </p>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td style="padding:0 32px 32px;text-align:center;">
              <a href="${appUrl}/pricing" style="display:inline-block;background:linear-gradient(135deg,#e8d5b7 0%,#c4a87c 100%);color:#0a0a0a;font-size:16px;font-weight:700;text-decoration:none;padding:14px 40px;border-radius:8px;">
                جدّد الآن ←
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;text-align:center;border-top:1px solid #1a1a2e;">
              <p style="margin:0;font-size:12px;color:#556677;">
                تمعّن — رحلة اكتشاف المعنى بلغة القرآن
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();

  const text = `${userName}، اشتراكك ينتهي قريباً

باقي ${daysLeft} أيام على انتهاء ${tierLabel}.

جدّد اشتراكك عشان تكمّل مسيرة اكتشاف المعنى.

جدّد الآن: ${appUrl}/pricing

— تمعّن`;

  return { subject, html, text };
}
