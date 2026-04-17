/**
 * قالب إيميل التحدي الأسبوعي — يُرسل كل سبت للمشتركين اللي أتمّوا الرحلة
 */

export interface WeeklyChallengeEmailPayload {
  userName: string;
  weekNum: number;
  challengeTitle: string;
  verse: string;
  verseRef: string;
  todayPrompt: string;
  appUrl: string;
}

export function buildWeeklyChallengeEmail(payload: WeeklyChallengeEmailPayload) {
  const { userName, weekNum, challengeTitle, verse, verseRef, todayPrompt, appUrl } = payload;

  const subject = `تحدي الأسبوع ${weekNum}: ${challengeTitle}`;

  const html = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="margin:0;padding:0;background:#f4f1ea;font-family:'Segoe UI',Tahoma,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px;">
    <div style="background:#fcfaf7;border:1px solid #d8cdb9;border-radius:16px;padding:32px 24px;">
      <p style="font-size:12px;color:#8c7851;margin:0 0 8px;letter-spacing:0.15em;">الأسبوع ${weekNum} بعد الإتمام</p>
      <h1 style="font-size:22px;color:#2f2619;margin:0 0 16px;">${userName}، ${challengeTitle}</h1>

      <div style="background:#f4f1ea;border-radius:12px;padding:20px;text-align:center;margin-bottom:20px;">
        <p style="font-size:20px;color:#2f2619;line-height:1.8;margin:0;">${verse}</p>
        <p style="font-size:12px;color:#8c7851;margin:6px 0 0;">${verseRef}</p>
      </div>

      <div style="background:#faf6ee;border:1px solid #c4a265aa;border-radius:12px;padding:16px;margin-bottom:20px;">
        <p style="font-size:11px;color:#7b694a;font-weight:bold;margin:0 0 6px;">تأمل اليوم</p>
        <p style="font-size:15px;color:#2f2619;line-height:1.7;margin:0;">${todayPrompt}</p>
      </div>

      <a href="${appUrl}/challenge" style="display:inline-block;background:#7b694a;color:#f4f1ea;padding:12px 28px;border-radius:10px;font-weight:bold;font-size:14px;text-decoration:none;">
        افتح التحدي
      </a>
    </div>
    <p style="text-align:center;font-size:11px;color:#8c7851;margin-top:20px;">
      تمعّن — رحلة اكتشاف المعنى بلغة القرآن
    </p>
  </div>
</body>
</html>`;

  const text = `${userName}، تحدي الأسبوع ${weekNum}: ${challengeTitle}

${verse} — ${verseRef}

تأمل اليوم: ${todayPrompt}

افتح التحدي: ${appUrl}/challenge`;

  return { subject, html, text };
}
