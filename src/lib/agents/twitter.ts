// ─── Twitter/X API Integration ───

const TWITTER_API_BASE = "https://api.twitter.com/2";

/**
 * Sends a DM reply via Twitter API v2.
 */
export async function sendTwitterDM(
  recipientId: string,
  text: string
): Promise<boolean> {
  const token = process.env.TWITTER_BEARER_TOKEN;
  if (!token) throw new Error("TWITTER_BEARER_TOKEN not set");

  const res = await fetch(
    `${TWITTER_API_BASE}/dm_conversations/with/${recipientId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
      }),
    }
  );

  return res.ok;
}

/**
 * Validates Twitter webhook CRC challenge.
 * Twitter sends a GET with crc_token, we must respond with HMAC-SHA256.
 */
export async function validateTwitterCRC(
  crcToken: string
): Promise<string> {
  const consumerSecret = process.env.TWITTER_CONSUMER_SECRET;
  if (!consumerSecret) throw new Error("TWITTER_CONSUMER_SECRET not set");

  // Use Web Crypto API (available in Edge Runtime / Node 18+)
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(consumerSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(crcToken)
  );
  const base64 = btoa(
    String.fromCharCode(...new Uint8Array(signature))
  );

  return `sha256=${base64}`;
}

/**
 * Parses Twitter webhook event for DMs.
 */
export function parseTwitterDMEvent(body: Record<string, unknown>): {
  senderId: string;
  text: string;
  messageId: string;
} | null {
  try {
    // Twitter Account Activity API v1.1 format
    const events = body.direct_message_events as Array<{
      type: string;
      id: string;
      message_create: {
        sender_id: string;
        message_data: { text: string };
      };
    }>;

    if (!events || events.length === 0) return null;

    const event = events[0];
    if (event.type !== "message_create") return null;

    return {
      senderId: event.message_create.sender_id,
      text: event.message_create.message_data.text,
      messageId: event.id,
    };
  } catch {
    return null;
  }
}

/**
 * Parses Twitter webhook event for mentions/replies.
 */
export function parseTwitterMentionEvent(body: Record<string, unknown>): {
  tweetId: string;
  senderId: string;
  text: string;
} | null {
  try {
    const events = body.tweet_create_events as Array<{
      id_str: string;
      user: { id_str: string };
      text: string;
    }>;

    if (!events || events.length === 0) return null;

    const tweet = events[0];
    return {
      tweetId: tweet.id_str,
      senderId: tweet.user.id_str,
      text: tweet.text,
    };
  } catch {
    return null;
  }
}

/**
 * Replies to a tweet.
 */
export async function replyToTweet(
  tweetId: string,
  text: string
): Promise<boolean> {
  const token = process.env.TWITTER_BEARER_TOKEN;
  if (!token) throw new Error("TWITTER_BEARER_TOKEN not set");

  const res = await fetch(`${TWITTER_API_BASE}/tweets`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text,
      reply: { in_reply_to_tweet_id: tweetId },
    }),
  });

  return res.ok;
}
