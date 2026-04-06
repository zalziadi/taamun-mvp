/**
 * قالب إيميل انتهاء الاشتراك — يُرسل عند انتهاء المدة
 */

export interface ExpiredEmailPayload {
  userName: string;
  tier: string;
  appUrl: string;
}

export function buildExpiredEmail(payload: ExpiredEmailPayload) {
  const { userName, tier, appUrl } = payload;

  const tierLabel =
    tier === "yearly" || tier === "vip"
      ? "الباقة السنوية"
      : tier === "eid"
        ? "باقة العيدية"
        : "الباقة الشهرية";

  const subject = `🔒 اشتراكك في تمعّن انتهى — جدّد الآن`;

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
            <td style="padding:32px 32px 24px;text-align:center;background:linear-gradient(135deg,#1a1a1a 0%,#2a2020 100%);">
              <div style="font-size:32px;margin-bottom:8px;">🔒</div>
              <h1 style="margin:0;font-size:22px;font-weight:700;color:#e8d5b7;letter-spacing:0.5px;">
                ${userName}، اشتراكك انتهى
              </h1>
              <p style="margin:8px 0 0;font-size:14px;color:#887766;">
                ${tierLabel} انتهت صلاحيتها
              </p>
            </td>
          </tr>

          <!-- Message -->
          <tr>
            <td style="padding:28px 32px;">
              <p style="margin:0;font-size:15px;color:#ccbbaa;line-height:1.8;text-align:center;">
                نشكرك على رحلتك مع تمعّن.<br/>
                بياناتك وتقدّمك محفوظة — جدّد اشتراكك وارجع من حيث وقفت.
              </p>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td style="padding:0 32px 32px;text-align:center;">
              <a href="${appUrl}/pricing" style="display:inline-block;background:linear-gradient(135deg,#e8d5b7 0%,#c4a87c 100%);color:#0a0a0a;font-size:16px;font-weight:700;text-decoration:none;padding:14px 40px;border-radius:8px;">
                جدّد اشتراكك ←
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

  const text = `${userName}، اشتراكك انتهى

${tierLabel} انتهت صلاحيتها.

نشكرك على رحلتك مع تمعّن.
بياناتك وتقدّمك محفوظة — جدّد اشتراكك وارجع من حيث وقفت.

جدّد اشتراكك: ${appUrl}/pricing

— تمعّن`;

  return { subject, html, text };
}
