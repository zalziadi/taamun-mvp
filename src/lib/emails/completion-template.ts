/**
 * قالب إيميل إتمام الرحلة — يُرسل عند إكمال اليوم ٢٨
 */

export interface CompletionEmailPayload {
  userName: string;
  completedDays: number;
  appUrl: string;
}

export function buildCompletionEmail(payload: CompletionEmailPayload) {
  const { userName, completedDays, appUrl } = payload;

  const subject = "◈ أتممت رحلة تمعّن — ٢٨ يوماً من التحوّل";

  const html = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="margin:0;padding:0;background:#f4f1ea;font-family:'Segoe UI',Tahoma,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px;">
    <div style="background:#1d1b17;border-radius:16px;padding:40px 28px;text-align:center;">
      <div style="font-size:48px;margin-bottom:16px;">◈</div>
      <h1 style="font-size:28px;color:#c9b88a;margin:0 0 12px;">${userName}، أتممت الرحلة</h1>
      <p style="font-size:15px;color:#e8e1d9;line-height:1.8;margin:0 0 24px;">
        ٢٨ يوماً من التمعّن — مررت بالظل، واكتشفت الهدية، ووصلت لأفضل احتمال.<br>
        هذه ليست نهاية — بل بداية طريقة جديدة في القراءة والحياة.
      </p>
      <div style="background:#c9b88a22;border:1px solid #c9b88a44;border-radius:12px;padding:16px;margin-bottom:24px;">
        <p style="font-size:13px;color:#c9b88a;margin:0;">${completedDays} يوم مكتمل</p>
      </div>
      <h2 style="font-size:18px;color:#e8e1d9;margin:0 0 12px;">وش الخطوة الجاية؟</h2>
      <p style="font-size:14px;color:#e8e1d9aa;line-height:1.7;margin:0 0 20px;">
        تحديات أسبوعية جديدة تنتظرك — كل أسبوع تحدي قرآني مختلف.<br>
        والمرشد تمعّن موجود معك كصديق مستمر.
      </p>
      <a href="${appUrl}/challenge" style="display:inline-block;background:#c9b88a;color:#1d1b17;padding:14px 32px;border-radius:10px;font-weight:bold;font-size:15px;text-decoration:none;">
        ابدأ أول تحدي أسبوعي
      </a>
      <br><br>
      <a href="${appUrl}/guide" style="display:inline-block;color:#c9b88a;font-size:13px;text-decoration:underline;">
        تحدّث مع تمعّن عن رحلتك
      </a>
    </div>
    <p style="text-align:center;font-size:11px;color:#8c7851;margin-top:20px;">
      تمعّن — رحلة اكتشاف المعنى بلغة القرآن
    </p>
  </div>
</body>
</html>`;

  const text = `${userName}، أتممت رحلة تمعّن — ٢٨ يوماً من التحوّل.

هذه ليست نهاية — بل بداية. تحديات أسبوعية جديدة تنتظرك.

ابدأ أول تحدي: ${appUrl}/challenge
تحدّث مع تمعّن: ${appUrl}/guide`;

  return { subject, html, text };
}
