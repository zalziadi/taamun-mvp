// ─── Instagram Graph API Integration ───

const GRAPH_API_BASE = "https://graph.instagram.com/v19.0";

/**
 * Sends a reply via Instagram Messaging API.
 */
export async function sendInstagramDM(
  recipientId: string,
  text: string
): Promise<boolean> {
  const pageToken = process.env.INSTAGRAM_PAGE_TOKEN;
  if (!pageToken) throw new Error("INSTAGRAM_PAGE_TOKEN not set");

  const res = await fetch(`${GRAPH_API_BASE}/me/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      recipient: { id: recipientId },
      message: { text },
      access_token: pageToken,
    }),
  });

  return res.ok;
}

/**
 * Verifies Instagram webhook subscription.
 * Meta sends a GET with hub.mode, hub.verify_token, hub.challenge.
 */
export function verifyInstagramWebhook(
  mode: string,
  token: string,
  challenge: string
): string | null {
  const verifyToken = process.env.INSTAGRAM_VERIFY_TOKEN;
  if (mode === "subscribe" && token === verifyToken) {
    return challenge;
  }
  return null;
}

/**
 * Parses Instagram webhook event for messages.
 */
export function parseInstagramMessageEvent(body: Record<string, unknown>): {
  senderId: string;
  text: string;
  messageId: string;
} | null {
  try {
    const obj = body.object as string;
    if (obj !== "instagram") return null;

    const entries = body.entry as Array<{
      messaging: Array<{
        sender: { id: string };
        message?: { mid: string; text: string };
      }>;
    }>;

    if (!entries || entries.length === 0) return null;

    const messaging = entries[0].messaging;
    if (!messaging || messaging.length === 0) return null;

    const event = messaging[0];
    if (!event.message?.text) return null;

    return {
      senderId: event.sender.id,
      text: event.message.text,
      messageId: event.message.mid,
    };
  } catch {
    return null;
  }
}

/**
 * Parses Instagram webhook event for comments.
 */
export function parseInstagramCommentEvent(body: Record<string, unknown>): {
  commentId: string;
  senderId: string;
  text: string;
  mediaId: string;
} | null {
  try {
    const obj = body.object as string;
    if (obj !== "instagram") return null;

    const entries = body.entry as Array<{
      changes?: Array<{
        field: string;
        value: {
          id: string;
          from: { id: string; username?: string };
          text: string;
          media: { id: string };
        };
      }>;
    }>;

    if (!entries || entries.length === 0) return null;

    const changes = entries[0].changes;
    if (!changes || changes.length === 0) return null;

    const change = changes.find((c) => c.field === "comments");
    if (!change) return null;

    return {
      commentId: change.value.id,
      senderId: change.value.from.id,
      text: change.value.text,
      mediaId: change.value.media.id,
    };
  } catch {
    return null;
  }
}

/**
 * Replies to an Instagram comment.
 */
export async function replyToInstagramComment(
  commentId: string,
  text: string
): Promise<boolean> {
  const pageToken = process.env.INSTAGRAM_PAGE_TOKEN;
  if (!pageToken) throw new Error("INSTAGRAM_PAGE_TOKEN not set");

  const res = await fetch(
    `${GRAPH_API_BASE}/${commentId}/replies?access_token=${pageToken}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text }),
    }
  );

  return res.ok;
}
