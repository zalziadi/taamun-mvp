/**
 * إرسال رسائل إلى Slack عبر Incoming Webhook.
 * يتطلب SLACK_WEBHOOK_URL في البيئة (Vercel / .env.local).
 */

export type SlackMessageOptions = {
  text: string;
  username?: string;
};

export async function sendSlackMessage(options: SlackMessageOptions): Promise<{ ok: boolean; error?: string }> {
  const url = process.env.SLACK_WEBHOOK_URL;
  if (!url) {
    return { ok: false, error: "SLACK_WEBHOOK_URL not set" };
  }

  const body: Record<string, unknown> = {
    text: options.text,
  };
  if (options.username) {
    body.username = options.username;
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const t = await res.text();
      return { ok: false, error: `slack_http_${res.status}: ${t.slice(0, 200)}` };
    }
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}
