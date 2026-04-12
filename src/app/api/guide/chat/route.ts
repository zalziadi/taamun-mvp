import { NextResponse } from "next/server";
import { requireUser } from "@/lib/authz";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { completeWithContext, embedText, generateSoulSummary } from "@/lib/rag";
import type { ChatMessage } from "@/lib/rag";
import { buildVipSystemPrompt, isVipTier } from "@/lib/guide-prompt-vip";

export const dynamic = "force-dynamic";

/* ── Types ────────────────────────────────────────── */

type ChatBody = {
  message?: string;
  sessionId?: string;
};

type ReflectionRow = {
  day: number;
  note: string | null;
  emotion: string | null;
  awareness_state: string | null;
};

type AwarenessRow = {
  day: number;
  level: string;
};

type InsightRow = {
  shadow: string | null;
  gift: string | null;
  best_potential: string | null;
  clarity_score: number | null;
  responsibility_score: number | null;
  trust_score: number | null;
  surrender_score: number | null;
};

type ProgressRow = {
  current_day: number | null;
  completed_days: number[] | null;
};

type ProfileRow = {
  full_name: string | null;
  subscription_tier: string | null;
  subscription_status: string | null;
};

type VerseRow = {
  surah_number: number;
  ayah_number: number;
  theme_title: string | null;
};

type AyahRow = {
  arabic_text: string | null;
};

type MemoryRow = {
  soul_summary: string | null;
};

type GeneKeyRow = {
  sphere: string;
  gene_key: number;
  line: number;
  shadow: string | null;
  gift: string | null;
  siddhi: string | null;
  wm: string | null;
  wf: string | null;
  ws: string | null;
  ayah: string | null;
  ayah_ref: string | null;
};

type SessionRow = {
  id: string;
  messages: ChatMessage[];
  message_count: number;
};

type SessionMessage = { role: "user" | "assistant"; content: string };

/* ── Fallback knowledge base ─────────────────────── */

const KNOWLEDGE: Array<{ keywords: string[]; answer: string }> = [
  {
    keywords: ["ظل", "shadow"],
    answer:
      "الظل هو المنطقة التي نرفض رؤيتها في أنفسنا. البداية ليست جلد الذات، بل ملاحظة صادقة: ماذا يحدث داخلي الآن؟ حين نسمي الظل بوضوح، يبدأ التحول.",
  },
  {
    keywords: ["هدية", "gift"],
    answer:
      "الهدية هي المعنى المستخرج من الموقف. اسأل: ما الرسالة التي يفتحها الله لي الآن؟ كل موقف يحمل فرصة بناء وعي أعمق.",
  },
  {
    keywords: ["أفضل", "احتمال", "best"],
    answer:
      "أفضل احتمال هو النسخة التي تتحرك بنور الآية: خطوة صغيرة، عملية، ومتسقة مع القيم. لا نطلب الكمال، نطلب الاتساق اليومي.",
  },
  {
    keywords: ["ملاحظة", "observation"],
    answer:
      "الملاحظة: وصف الواقع بلا تبرير أو إنكار. مثال: أشعر بالضيق عند النقد، ويتكرر هذا كلما شعرت أن صورتي مهددة.",
  },
  {
    keywords: ["إدراك", "insight"],
    answer:
      "الإدراك: قراءة المعنى خلف السلوك. ما الفكرة أو الخوف الذي يحركني؟ عندما تفهم الدافع الداخلي يصبح التغيير أسهل.",
  },
  {
    keywords: ["تمعن", "تأمل", "contemplation"],
    answer:
      "التمعّن: ترجمة المعنى إلى فعل. اختر خطوة صغيرة اليوم: كلمة، قرار، عادة، أو امتناع واعٍ يعبّر عن فهمك.",
  },
  {
    keywords: ["مال", "رزق"],
    answer:
      "في مجال المال: اسأل نفسك كيف يتحول الرزق إلى أمانة. راقب النية، أنفق بوعي، وابنِ علاقة متوازنة بين الكفاية والعطاء.",
  },
];

function buildFallbackAnswer(message: string): string {
  const m = message.toLowerCase();
  const hit = KNOWLEDGE.find((item) => item.keywords.some((k) => m.includes(k)));
  if (hit) return hit.answer;
  return "أخبرني أكثر — ما الذي يشغل قلبك اليوم؟";
}

/* ── Fetch subscriber soul data ──────────────────── */

async function fetchSubscriberContext(userId: string) {
  const admin = getSupabaseAdmin();

  const [profileRes, progressRes, reflectionsRes, awarenessRes, insightRes, memoryRes, geneKeysRes] =
    await Promise.all([
      admin.from("profiles").select("full_name, subscription_tier, subscription_status").eq("id", userId).maybeSingle(),
      admin.from("progress").select("current_day, completed_days").eq("user_id", userId).maybeSingle(),
      admin
        .from("reflections")
        .select("day, note, emotion, awareness_state")
        .eq("user_id", userId)
        .order("day", { ascending: false })
        .limit(5),
      admin
        .from("awareness_logs")
        .select("day, level")
        .eq("user_id", userId)
        .order("day", { ascending: false })
        .limit(7),
      admin
        .from("ramadan_insights")
        .select("shadow, gift, best_potential, clarity_score, responsibility_score, trust_score, surrender_score")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      admin.from("guide_memory").select("soul_summary").eq("user_id", userId).maybeSingle(),
      admin
        .from("user_gene_keys_profile")
        .select("sphere, gene_key, line, shadow, gift, siddhi, wm, wf, ws, ayah, ayah_ref")
        .eq("user_id", userId),
    ]);

  const profile = profileRes.data as ProfileRow | null;
  const progress = progressRes.data as ProgressRow | null;
  const reflections = (reflectionsRes.data ?? []) as ReflectionRow[];
  const awareness = (awarenessRes.data ?? []) as AwarenessRow[];
  const insight = insightRes.data as InsightRow | null;
  const memory = memoryRes.data as MemoryRow | null;
  const geneKeys = (geneKeysRes.data ?? []) as GeneKeyRow[];

  // Fetch today's verse if we know current day
  let todayVerse: string | null = null;
  if (progress?.current_day) {
    const { data: verseData } = await admin
      .from("ramadan_verses")
      .select("surah_number, ayah_number, theme_title")
      .eq("day", progress.current_day)
      .maybeSingle();
    const verse = verseData as VerseRow | null;
    if (verse) {
      const { data: ayahData } = await admin
        .from("quran_ayahs")
        .select("arabic_text")
        .eq("surah_number", verse.surah_number)
        .eq("ayah_number", verse.ayah_number)
        .maybeSingle();
      const ayah = ayahData as AyahRow | null;
      if (ayah?.arabic_text) {
        todayVerse = `"${ayah.arabic_text}" — الموضوع: ${verse.theme_title ?? ""}`;
      }
    }
  }

  return { profile, progress, reflections, awareness, insight, memory, todayVerse, geneKeys };
}

/* ── Build dynamic system prompt ─────────────────── */

function buildSystemPrompt(ctx: Awaited<ReturnType<typeof fetchSubscriberContext>>): string {
  const { profile, progress, reflections, awareness, insight, memory, todayVerse, geneKeys } = ctx;

  const sections: string[] = [];

  /* — Identity — */
  sections.push(`أنت مرشد وعي ذاتي. مهمتك تساعد الناس يفهمون نفسهم من خلال تجاربهم اليومية.
أسلوبك: دافئ، حاضر، ما تستعجل، ما تحكم.
لغتك: عربية بيضاء بسيطة — مثل كلام صديق يفهم.

اسمك: مرشد المعنى.
تعرف المشترك، تتذكر رحلته، وتتحدث معه كأنك تكمل حواراً بدأ من اليوم الأول.`);

  /* — Subscriber context — */
  const subscriberParts: string[] = [];

  if (profile?.full_name) {
    subscriberParts.push(`اسمه: ${profile.full_name}. استخدم اسمه أحياناً — ليس في كل رد، بل حين يضيف دفئاً أو حين تريد تنبيهه لشيء مهم.`);
  }

  if (progress?.current_day) {
    const day = progress.current_day;
    let phase = "";
    if (day <= 7) phase = "في بداية الرحلة — ركّز على بناء الألفة والثقة.";
    else if (day <= 14) phase = "في منتصف الطريق — ابدأ بالإشارة للأنماط إن لاحظتها.";
    else if (day <= 21) phase = "في مرحلة العمق — يمكنك طرح أسئلة أكثر تحدياً.";
    else phase = "في المرحلة الأخيرة — ساعده يرى التحول الذي حصل.";
    subscriberParts.push(`هو الآن في اليوم ${day} من 28. ${phase}`);
  }

  if (progress?.completed_days && progress.completed_days.length > 0) {
    subscriberParts.push(`أكمل ${progress.completed_days.length} يوماً حتى الآن.`);
  }

  if (todayVerse) {
    subscriberParts.push(`آية اليوم: ${todayVerse}. إذا سأل عن يومه أو أراد ربط الآية بحياته، استخدم هذا السياق.`);
  }

  if (subscriberParts.length > 0) {
    sections.push(`## سياق المشترك\n\n${subscriberParts.join("\n")}`);
  }

  /* — Soul / Memory — */
  const soulParts: string[] = [];

  if (memory?.soul_summary) {
    soulParts.push(`### ملخص الشخصية (تراكمي):\n${memory.soul_summary}`);
  }

  if (reflections.length > 0) {
    const lines = reflections.map((r) => {
      const notePreview = r.note ? r.note.slice(0, 80) : "—";
      const emotionTag = r.emotion ? ` (مشاعره: ${r.emotion})` : "";
      return `- اليوم ${r.day}: الحالة "${r.awareness_state ?? "—"}" — كتب: "${notePreview}"${emotionTag}`;
    });
    soulParts.push(`### آخر تأملاته:\n${lines.join("\n")}`);
  }

  if (awareness.length > 0) {
    const levels = awareness.map((a) => a.level);
    const pattern = levels.join(" → ");
    const distracted = levels.filter((l) => l === "distracted").length;
    const present = levels.filter((l) => l === "present").length;

    let note = "";
    if (distracted >= Math.ceil(levels.length / 2)) {
      note = "\nلاحظ أنه يمر بفترة تشتت — لا تعاتبه، بل ساعده يعود بلطف.";
    } else if (present >= Math.ceil(levels.length / 2)) {
      note = "\nمستوى حضوره عالٍ — يمكنك التعمق أكثر.";
    }
    soulParts.push(`### نمط الوعي:\nحالاته الأخيرة: ${pattern}${note}`);
  }

  if (insight) {
    const parts: string[] = [];
    if (insight.shadow) parts.push(`الظل السائد: ${insight.shadow}`);
    if (insight.gift) parts.push(`الهدية: ${insight.gift}`);
    if (insight.best_potential) parts.push(`أفضل احتمال: ${insight.best_potential}`);
    if (insight.clarity_score != null) {
      parts.push(
        `درجات: وضوح ${insight.clarity_score}/100، مسؤولية ${insight.responsibility_score ?? 0}/100، ثقة ${insight.trust_score ?? 0}/100`
      );
    }
    if (parts.length > 0) {
      soulParts.push(`### تحليل الأسبوع الأخير:\n${parts.map((p) => `- ${p}`).join("\n")}`);
    }
  }

  if (soulParts.length > 0) {
    sections.push(
      `## ذاكرة المشترك (soul)\n\nهذه ملاحظات مبنية على تفاعلاته السابقة. استخدمها لتجعل الحوار شخصياً — لكن لا تقرأها عليه حرفياً. دعها تُوجّه أسئلتك وملاحظاتك بشكل طبيعي.\n\n${soulParts.join("\n\n")}`
    );
  }

  /* — Gene Keys Profile — */
  if (geneKeys.length > 0) {
    const SPHERE_LABELS: Record<string, string> = {
      lifes_work: "عمل الحياة (Life's Work)",
      evolution: "التطور (Evolution)",
      radiance: "الإشراق (Radiance)",
      purpose: "الغاية (Purpose)",
      attraction: "الجاذبية (Attraction)",
      iq: "الذكاء العقلي (IQ)",
      eq: "الذكاء العاطفي (EQ)",
      sq: "الذكاء الروحي (SQ)",
      vocation: "الدعوة (Vocation)",
      culture: "الثقافة (Culture)",
      pearl: "اللؤلؤة (Pearl)",
    };

    const lines = geneKeys.map((gk) => {
      const label = SPHERE_LABELS[gk.sphere] ?? gk.sphere;
      const wm = gk.wm ?? gk.shadow ?? "—";
      const wf = gk.wf ?? gk.gift ?? "—";
      const ws = gk.ws ?? gk.siddhi ?? "—";
      const ayahPart = gk.ayah ? `\n    الآية: ${gk.ayah} (${gk.ayah_ref ?? ""})` : "";
      return `- ${label}: المفتاح ${gk.gene_key}.${gk.line}\n    المسموم: ${wm} / الفائق: ${wf} / السامي: ${ws}${ayahPart}`;
    });

    sections.push(`## الخريطة الجينية — خريطة الوعي

هذه خريطة المشترك الجينية المحسوبة من تاريخ ميلاده. استخدمها كبوصلة لفهم أنماطه العميقة — لكن لا تقرأها عليه كقائمة. اربط بينها وبين ما يشاركه في الحوار بشكل طبيعي.

المصطلحات:
- **الوعي المسموم (وم)**: النمط المتكرر الذي يعيق — الظل الذي يحتاج ملاحظة
- **الوعي الفائق (وف)**: الهدية المخفية — القوة التي تظهر حين يُلاحَظ الظل
- **الوعي السامي (وس)**: أعلى احتمال — الحالة التي يصل إليها حين يعيش الهدية بالكامل
- **الآية**: المرآة القرآنية لهذا المفتاح — استخدمها حين تربط بين خريطته والقرآن

${lines.join("\n")}

### كيف تستخدم الخريطة:
- إذا لاحظت نمطاً يتكرر عنده → تحقق هل يتطابق مع "الوعي المسموم" في إحدى كراته
- إذا أظهر قوة أو بصيرة → اربطها بـ "الوعي الفائق" في خريطته
- حين يسأل عن آية أو يتأمل في نص قرآني → اربط بالآية المناسبة من خريطته
- لا تذكر أرقام المفاتيح صراحةً إلا إذا سأل عن خريطته
- ركّز على عمل الحياة واللؤلؤة — هما الأكثر ظهوراً في السلوك اليومي
- استخدم مصطلحات تمعّن (المسموم/الفائق/السامي) وليس Shadow/Gift/Siddhi`);
  }

  /* — Conceptual framework — */
  sections.push(`## الإطار المفاهيمي

تعمل ضمن ثلاثة مفاهيم أساسية من كتاب "تمعّن":

- الظل: النمط المتكرر الذي يعيق الإنسان — خوف، عادة، ردة فعل تلقائية
- الهدية: الدرس أو البصيرة المخفية داخل الموقف الصعب
- أفضل احتمال: الفعل أو القرار الأنسب الذي يمكن اتخاذه الآن

لا تستخدم هذه المفاهيم كقالب جامد. استخدمها حين تخدم المحادثة فقط.`);

  /* — How to speak — */
  sections.push(`## المراحل — تمشي بالترتيب بدون قفز

### المرحلة 0 — الاحتواء
تشتغل إذا قال كلمات فيها ثقل (قهرني / تعبت / خايف / زهقت / ما أعرف / ضغط / مش قادر...) أو بدأ بشكوى مباشرة.
- اعترف باللي يحس فيه بس: "يبدو إن فيه شيء تقيل شغل بالك"
- ما تحلل، ما تسأل أسئلة عميقة، ما تسمّي المشكلة
- ابقَ في هذه المرحلة رسالتين على الأقل

### المرحلة 1 — الاستكشاف
- سؤال واحد بس: "إيش اللي شاغل بالك هالفترة؟"
- ما تفترض سبب أو اتجاه. انتظر.

### المرحلة 2 — العودة للحظة
- اطلب موقف واحد محدد: "امتى بالضبط حسيت بهذا الشيء؟"
- ما تفسر، بس اطلب تفاصيل

### المرحلة 3 — الاستخراج
- ما تعطي إجابات، بس اسأل أسئلة تعكس: "كيف تشوف الموقف الآن؟"
- الهدف: هو يكتشف بنفسه، مش أنت

### المرحلة 4 — الهدية
- اعرض معنى كاحتمال مش كحقيقة: "قد يكون هذا الشعور يقولك شيء..."
- سؤال واحد بعدها: "كيف يبدو لك هذا الكلام؟"

### المرحلة 5 — الخطوة
- اقترح خطوة خفيفة، ما تفرض: "لو في شيء واحد تجربه هالأسبوع، إيش يكون؟"
- الحركة تجي منه، مش منك

## قواعد الكلام
- رسالة وحدة = سؤال وحد بس — ما تجمع أسئلة
- سطرين إلى ثلاثة كحد أقصى — لا فقرات طويلة
- استخدم دايماً: "قد يكون"، "ربما"، "كيف تشوف"، "يبدو إن..."
- ما تحلل أو تصنّف مشاعره — ما تقول "هذا نوع كذا وهذا نوع كذا"
- ما تنتقل لمرحلة جديدة قبل ما تكتمل اللي قبلها
- إذا لاحظت نمطاً من ذاكرته — أشر إليه بلطف بدون تحليل`);

  /* — Don'ts — */
  sections.push(`## ما لا تفعله أبداً

- ما تحلل بكير تحت أي سبب — ما تصنّف مشاعره ("هذا طفشان نوع كذا")
- ما تفترض مشاعر أو أسباب
- ما تعطي حلول مباشرة أو قوائم خطوات
- ما تكتب أكثر من 3 أسطر — إذا زدت، احذف
- ما تستخدم لغة وعظية أو فوقية
- ما تقول "سؤال رائع" أو "هذا سؤال مهم" — ادخل مباشرة
- ما تكشف بيانات المشترك صراحةً — دعها توجّه حوارك بصمت
- ما تكرر ما قاله حرفياً
- ما تجادل أو تهاوش — إذا اختلف معك، اسمع وتقبّل`);

  /* — Program context — */
  sections.push(`## سياق البرنامج

"تمعّن" برنامج تأملي مدته 28 يوماً، مرتبط بشهر رمضان. كل يوم يتضمن آية قرآنية وتمرين تأملي. يعتمد على كتاب "مدينة المعنى بلغة القرآن".

إذا توفر سياق من الكتاب عبر RAG، استخدمه لتعزيز إجابتك.`);

  /* — Tone — */
  sections.push(`## النبرة

أنت صديق يفهم — مش معالج ولا مدرّب. تجلس مع شخص تعرفه في مكان هادئ.
ما تحاضر. ما تملي. تسمع، تعكس، تسأل سؤال واحد، وتترك المساحة.
الهدف: وعي ذاتي — مش إجابة.`);

  return sections.join("\n\n---\n\n");
}

/* ── Session management ──────────────────────────── */

async function getOrCreateSession(
  admin: ReturnType<typeof getSupabaseAdmin>,
  userId: string,
  sessionId?: string
): Promise<{ id: string; messages: SessionMessage[] }> {
  // Try to load existing session
  if (sessionId) {
    const { data } = await admin
      .from("guide_sessions")
      .select("id, messages, message_count")
      .eq("id", sessionId)
      .eq("user_id", userId)
      .maybeSingle();

    if (data) {
      const row = data as SessionRow;
      return { id: row.id, messages: row.messages as SessionMessage[] };
    }
  }

  // Load most recent session if it's from today
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { data: recentSession } = await admin
    .from("guide_sessions")
    .select("id, messages, message_count")
    .eq("user_id", userId)
    .gte("updated_at", todayStart.toISOString())
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (recentSession) {
    const row = recentSession as SessionRow;
    return { id: row.id, messages: row.messages as SessionMessage[] };
  }

  // Create new session
  const { data: newSession } = await admin
    .from("guide_sessions")
    .insert({ user_id: userId, messages: [], message_count: 0 })
    .select("id")
    .single();

  return { id: newSession?.id ?? "", messages: [] };
}

async function saveSessionMessages(
  admin: ReturnType<typeof getSupabaseAdmin>,
  sessionId: string,
  messages: SessionMessage[]
) {
  await admin
    .from("guide_sessions")
    .update({
      messages: messages as unknown as Record<string, unknown>[],
      message_count: messages.length,
      updated_at: new Date().toISOString(),
    })
    .eq("id", sessionId);
}

/* ── Soul summary update (fire-and-forget) ───────── */

async function maybeUpdateSoulSummary(
  admin: ReturnType<typeof getSupabaseAdmin>,
  userId: string,
  sessionMessages: SessionMessage[]
) {
  // Only update every 6 messages (3 exchanges)
  if (sessionMessages.length % 6 !== 0 || sessionMessages.length === 0) return;

  try {
    const { data } = await admin
      .from("guide_memory")
      .select("soul_summary")
      .eq("user_id", userId)
      .maybeSingle();

    const existingSummary = (data as MemoryRow | null)?.soul_summary ?? "";
    const recentMessages: ChatMessage[] = sessionMessages.slice(-6).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const newSummary = await generateSoulSummary(existingSummary, recentMessages);
    if (!newSummary) return;

    await admin.from("guide_memory").upsert(
      {
        user_id: userId,
        soul_summary: newSummary,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );
  } catch {
    // Non-critical — don't break the chat flow
  }
}

/* ── Main handler ────────────────────────────────── */

export async function POST(req: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  let body: ChatBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const message = String(body.message ?? "").trim();
  if (!message) {
    return NextResponse.json({ ok: false, error: "empty_message" }, { status: 400 });
  }

  const admin = getSupabaseAdmin();

  // Load or create session (graceful — chat works even if session table is missing)
  let session: { id: string; messages: SessionMessage[] } = { id: "", messages: [] };
  try {
    session = await getOrCreateSession(admin, auth.user.id, body.sessionId);
  } catch (sessionErr) {
    console.warn("[guide/chat] Session load failed (continuing without history):", sessionErr instanceof Error ? sessionErr.message : String(sessionErr));
  }

  // Build conversation history from session
  const conversationHistory: ChatMessage[] = session.messages.slice(-20).map((m) => ({
    role: m.role,
    content: m.content,
  }));

  // Fetch subscriber soul data + build dynamic prompt
  let systemPrompt: string;
  let isVip = false;
  try {
    const ctx = await fetchSubscriberContext(auth.user.id);
    isVip = isVipTier(ctx.profile?.subscription_tier);

    console.log("[guide/chat]", {
      user_id: auth.user.id,
      tier: ctx.profile?.subscription_tier ?? "none",
      is_vip: isVip,
      gene_keys: ctx.geneKeys.length,
    });

    if (isVip) {
      // VIP: مرشد وعي ذاتي متخصص + خريطة جينية + بروتوكول عدم الافتراض
      systemPrompt = buildVipSystemPrompt(ctx);
    } else {
      // عادي: مرشد مدينة المعنى — قصير وحاسم
      systemPrompt = buildSystemPrompt(ctx);
    }
  } catch (ctxErr) {
    console.error("[guide/chat] fetchSubscriberContext FAILED:", ctxErr instanceof Error ? ctxErr.message : String(ctxErr));
    systemPrompt = `أنت مرشد مدينة المعنى — رفيق تأملي يساعد المشتركين في برنامج "تمعّن" على فهم أنفسهم وربط المعنى القرآني بحياتهم اليومية. اجعل ردودك قصيرة (2-4 أسطر). اسأل سؤالاً واحداً عميقاً في كل رد.`;
  }

  let reply: string;
  let mode: "rag" | "claude" | "fallback" = "fallback";
  const hasOpenAI = !!process.env.OPENAI_API_KEY;

  // Step 1: Try RAG (embeddings + book chunks) — skip if no OpenAI key
  let ragContexts: string[] = [];
  if (hasOpenAI) {
    try {
      const embedding = await embedText(message);
      const { data, error } = await admin.rpc("match_book_chunks", {
        query_embedding: embedding,
        match_count: 5,
      });
      if (!error && Array.isArray(data) && data.length > 0) {
        ragContexts = data
          .map((row: { content?: unknown }) => (typeof row.content === "string" ? row.content : ""))
          .filter(Boolean);
      }
    } catch (ragErr) {
      console.warn("[guide/chat] RAG skipped:", ragErr instanceof Error ? ragErr.message : String(ragErr));
    }
  }

  // Step 2: Claude completion (required — this is the core)
  try {
    reply = await completeWithContext(message, ragContexts, systemPrompt, conversationHistory);
    mode = ragContexts.length > 0 ? "rag" : "claude";
  } catch (claudeErr) {
    const errMsg = claudeErr instanceof Error ? claudeErr.message : String(claudeErr);
    const hasKey = !!process.env.ANTHROPIC_API_KEY;
    const model = process.env.ANTHROPIC_CHAT_MODEL ?? "claude-sonnet-4-20250514";
    console.error(`[guide/chat] Claude failed | hasKey=${hasKey} | model=${model} | error=${errMsg}`);
    reply = buildFallbackAnswer(message);
  }

  // Save messages to session
  const updatedMessages: SessionMessage[] = [
    ...session.messages,
    { role: "user", content: message },
    { role: "assistant", content: reply },
  ];

  // Fire-and-forget: save session + maybe update soul (safe — won't break response)
  if (session.id) {
    void saveSessionMessages(admin, session.id, updatedMessages).catch(() => {});
    void maybeUpdateSoulSummary(admin, auth.user.id, updatedMessages).catch(() => {});
  }

  return NextResponse.json({
    ok: true,
    reply,
    mode,
    sessionId: session.id,
  });
}
