import { NextResponse } from "next/server";
import { requireUser } from "@/lib/authz";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { completeWithContext, embedText } from "@/lib/rag";

export const dynamic = "force-dynamic";

type ChatBody = {
  message?: string;
};

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

function buildAnswer(message: string): string {
  const m = message.toLowerCase();
  const hit = KNOWLEDGE.find((item) => item.keywords.some((k) => m.includes(k)));
  if (hit) return hit.answer;

  return "مرشد المعنى: ابدأ بثلاثية التحول اليوم.\n1) ما ظلّك الآن؟\n2) ما الهدية في هذا الموقف؟\n3) ما أفضل خطوة عملية قبل نهاية اليوم؟";
}

const GUIDE_SYSTEM_PROMPT =
  "أنت مرشد روحي عربي مبني على كتاب مدينة المعنى. استخدم فقط السياق المقدم من الكتاب. كن موجزاً، هادئاً، عملياً. اختم باقتراح سؤال تأملي واحد.";

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

  try {
    const embedding = await embedText(message);
    const admin = getSupabaseAdmin();
    const { data, error } = await admin.rpc("match_book_chunks", {
      query_embedding: embedding,
      match_count: 5,
    });

    if (!error && Array.isArray(data) && data.length > 0) {
      const contexts = data
        .map((row: { content?: unknown }) => (typeof row.content === "string" ? row.content : ""))
        .filter(Boolean);
      const reply = await completeWithContext(message, contexts, GUIDE_SYSTEM_PROMPT);
      return NextResponse.json({
        ok: true,
        reply,
        mode: "rag",
      });
    }
  } catch {
    // Fall back to deterministic local guide.
  }

  return NextResponse.json({
    ok: true,
    reply: buildAnswer(message),
    mode: "fallback",
  });
}
