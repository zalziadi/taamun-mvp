/**
 * وردة — WhatsApp + Claude Bot
 * سيرفر يستقبل رسائل واتساب عبر Meta Cloud API ويرد عبر Claude
 */

import 'dotenv/config';
import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Config ───────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const WHATSAPP_VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;
const CLAUDE_MODEL = process.env.CLAUDE_MODEL || 'claude-haiku-4-5-20251001';

// ─── Validate env ─────────────────────────────────────────────
const required = ['ANTHROPIC_API_KEY', 'WHATSAPP_TOKEN', 'WHATSAPP_PHONE_NUMBER_ID', 'WHATSAPP_VERIFY_TOKEN'];
for (const key of required) {
  if (!process.env[key]) {
    console.error(`❌ متغير البيئة ${key} مطلوب. تحقق من ملف .env`);
    process.exit(1);
  }
}

// ─── Claude client ────────────────────────────────────────────
const anthropic = new Anthropic();

// ─── System prompt ────────────────────────────────────────────
let SYSTEM_PROMPT;
try {
  const raw = readFileSync(join(__dirname, 'warda-system-prompt.md'), 'utf-8');
  // استخراج المحتوى داخل بلوك الكود
  const match = raw.match(/```text\n([\s\S]*?)```/);
  SYSTEM_PROMPT = match ? match[1].trim() : raw;
} catch {
  console.error('⚠️ لم يُعثر على warda-system-prompt.md — يُستخدم prompt افتراضي');
  SYSTEM_PROMPT = 'أنتِ وردة، مسؤولة خدمة العملاء. ردّي بلطف واختصار.';
}

// ─── Conversation memory (in-memory, per phone number) ────────
// يحفظ آخر 10 رسائل لكل رقم
const conversations = new Map();
const MAX_HISTORY = 10;

function getHistory(phone) {
  if (!conversations.has(phone)) {
    conversations.set(phone, []);
  }
  return conversations.get(phone);
}

function addMessage(phone, role, content) {
  const history = getHistory(phone);
  history.push({ role, content });
  // حافظ على آخر 10 رسائل فقط
  if (history.length > MAX_HISTORY) {
    history.splice(0, history.length - MAX_HISTORY);
  }
}

// ─── Claude API call ──────────────────────────────────────────
async function askClaude(phone, userMessage) {
  addMessage(phone, 'user', userMessage);

  try {
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 300, // ردود قصيرة للواتساب
      system: SYSTEM_PROMPT,
      messages: getHistory(phone),
    });

    const reply = response.content[0]?.text || 'عذراً، حصل خطأ. حاول مرة ثانية.';
    addMessage(phone, 'assistant', reply);
    return reply;
  } catch (err) {
    console.error('❌ Claude API error:', err.message);
    return 'عذراً، النظام مشغول حالياً. حاول بعد شوي 🌸';
  }
}

// ─── WhatsApp: send message ───────────────────────────────────
async function sendWhatsAppMessage(to, text) {
  const url = `https://graph.facebook.com/v21.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: text },
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    console.error('❌ WhatsApp send error:', error);
  }
}

// ─── Express server ───────────────────────────────────────────
const app = express();
app.use(express.json());

// Webhook verification (Meta يرسل GET عند الإعداد)
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === WHATSAPP_VERIFY_TOKEN) {
    console.log('✅ Webhook verified');
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

// Webhook handler (Meta يرسل POST عند كل رسالة)
app.post('/webhook', async (req, res) => {
  // أرجع 200 فوراً (Meta يتوقع رد سريع)
  res.sendStatus(200);

  try {
    const entry = req.body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    // تأكد إن هذي رسالة واردة (مو status update)
    if (!value?.messages?.[0]) return;

    const message = value.messages[0];
    const from = message.from; // رقم المرسل
    const msgType = message.type;

    // حالياً نعالج النصوص فقط
    if (msgType !== 'text') {
      await sendWhatsAppMessage(from, 'حالياً أقدر أساعدك بالرسائل النصية فقط 🌸');
      return;
    }

    const userText = message.text.body;
    console.log(`📩 من ${from}: ${userText}`);

    // استدعاء Claude
    const reply = await askClaude(from, userText);
    console.log(`🌸 وردة → ${from}: ${reply}`);

    // إرسال الرد
    await sendWhatsAppMessage(from, reply);
  } catch (err) {
    console.error('❌ Webhook error:', err);
  }
});

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    bot: 'وردة',
    model: CLAUDE_MODEL,
    activeConversations: conversations.size,
  });
});

// ─── Start ────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🌸 وردة شغّالة على المنفذ ${PORT}`);
  console.log(`   الموديل: ${CLAUDE_MODEL}`);
  console.log(`   Webhook URL: https://YOUR-DOMAIN/webhook`);
  console.log(`   Health: http://localhost:${PORT}/health`);
});
