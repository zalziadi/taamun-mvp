/**
 * قالب إيميل التفعيل — يُرسل بعد 5 دقائق من الدفع
 * يحتوي: كود التفعيل + خطوات الدخول + CTA
 */

export interface ActivationEmailPayload {
  userName: string;
  activationCode: string;
  tier: string;
  appUrl: string;
}

export function buildActivationEmail(payload: ActivationEmailPayload) {
  const { userName, activationCode, tier, appUrl } = payload;

  const tierLabel =
    tier === "yearly" || tier === "vip"
      ? "الباقة السنوية"
      : tier === "eid"
        ? "باقة العيدية"
        : "الباقة الشهرية";

  const subject = `🔑 كود تفعيل تمعّن جاهز — ${tierLabel}`;

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
            <td style="padding:32px 32px 24px;text-align:center;background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);">
              <div style="font-size:32px;margin-bottom:8px;">✨</div>
              <h1 style="margin:0;font-size:22px;font-weight:700;color:#e8d5b7;letter-spacing:0.5px;">
                أهلاً ${userName}
              </h1>
              <p style="margin:8px 0 0;font-size:14px;color:#8899aa;">
                ${tierLabel} مفعّلة — الرحلة تبدأ الآن
              </p>
            </td>
          </tr>

          <!-- Activation Code -->
          <tr>
            <td style="padding:28px 32px;">
              <p style="margin:0 0 12px;font-size:14px;color:#8899aa;text-align:center;">
                كود التفعيل الخاص بك
              </p>
              <div style="background:#1a1a2e;border:1px solid #2a2a4e;border-radius:12px;padding:20px;text-align:center;">
                <span style="font-size:28px;font-weight:700;color:#e8d5b7;letter-spacing:4px;font-family:monospace;">
                  ${activationCode}
                </span>
              </div>
            </td>
          </tr>

          <!-- Steps -->
          <tr>
            <td style="padding:0 32px 28px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                ${step(1, "ادخل على تمعّن", `اذهب إلى <a href="${appUrl}" style="color:#e8d5b7;text-decoration:underline;">${appUrl}</a>`)}
                ${step(2, "سجّل دخولك بالإيميل", "ستصلك رسالة تأكيد — اضغط الرابط")}
                ${step(3, "أدخل الكود أعلاه", "في صفحة التفعيل وابدأ رحلتك")}
              </table>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td style="padding:0 32px 32px;text-align:center;">
              <a href="${appUrl}/pricing" style="display:inline-block;background:linear-gradient(135deg,#e8d5b7 0%,#c4a87c 100%);color:#0a0a0a;font-size:16px;font-weight:700;text-decoration:none;padding:14px 40px;border-radius:8px;">
                ابدأ الرحلة ←
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

  const text = `أهلاً ${userName}

${tierLabel} مفعّلة — الرحلة تبدأ الآن

كود التفعيل: ${activationCode}

الخطوات:
1. ادخل على ${appUrl}
2. سجّل دخولك بالإيميل
3. أدخل الكود في صفحة التفعيل

ابدأ الرحلة: ${appUrl}/pricing

— تمعّن`;

  return { subject, html, text };
}

function step(num: number, title: string, desc: string): string {
  return `
    <tr>
      <td style="padding:8px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="36" valign="top" style="padding-left:12px;">
              <div style="width:28px;height:28px;border-radius:50%;background:#1a1a2e;color:#e8d5b7;font-size:14px;font-weight:700;line-height:28px;text-align:center;">
                ${num}
              </div>
            </td>
            <td valign="top">
              <p style="margin:0;font-size:14px;font-weight:600;color:#e0e0e0;">${title}</p>
              <p style="margin:2px 0 0;font-size:13px;color:#8899aa;">${desc}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>`;
}
