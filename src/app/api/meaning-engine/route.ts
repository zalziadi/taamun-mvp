import { NextResponse } from "next/server";
import { requireUser } from "@/lib/authz";
import { type AwarenessState } from "@/lib/city-of-meaning";
import { completeWithContext } from "@/lib/rag";

export const dynamic = "force-dynamic";

type MeaningEngineBody = {
  ayah?: string;
  emotion?: string;
  awareness_state?: AwarenessState | string;
  reflection?: string;
};

const STATE_LABELS: Record<AwarenessState, string> = {
  shadow: "الظل",
  gift: "الهدية",
  best_possibility: "أفضل احتمال",
};

function normalizeState(value: string | undefined): AwarenessState | null {
  if (value === "shadow" || value === "gift" || value === "best_possibility") return value;
  return null;
}

function localMeaningEngine(
  ayah: string,
  emotion: string,
  awarenessState: AwarenessState,
  reflection: string
) {
  const stateLabel = STATE_LABELS[awarenessState];
  const emotionText = emotion || "مشاعر غير مسماة";

  return {
    insight: `عند قراءة الآية "${ayah}" مع شعور "${emotionText}" وفي حالة "${stateLabel}"، الرسالة الأقرب هي: انتقل من رد الفعل إلى المعنى عبر تسمية ما يحدث داخلك بصدق.`,
    suggested_question:
      awarenessState === "shadow"
        ? "ما الحقيقة التي أتجنب رؤيتها الآن؟"
        : awarenessState === "gift"
        ? "ما الرسالة الرحيمة التي تحملها هذه التجربة؟"
        : "ما أصغر فعل اليوم يثبت أفضل احتمال فيّ؟",
    suggested_contemplation_practice: `خلال 7 دقائق: اقرأ الآية ببطء 3 مرات، ثم اكتب سطرًا واحدًا يبدأ بـ "اليوم سأعيش معنى..." مستندًا إلى تأملك: ${reflection.slice(0, 100)}.`,
  };
}

export async function POST(req: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  let body: MeaningEngineBody;
  try {
    body = (await req.json()) as MeaningEngineBody;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const ayah = String(body.ayah ?? "").trim();
  const emotion = String(body.emotion ?? "").trim();
  const reflection = String(body.reflection ?? "").trim();
  const awarenessState = normalizeState(String(body.awareness_state ?? ""));

  if (!ayah || !reflection || !awarenessState) {
    return NextResponse.json(
      { ok: false, error: "missing_required_fields" },
      { status: 400 }
    );
  }

  const local = localMeaningEngine(ayah, emotion, awarenessState, reflection);

  try {
    const ai = await completeWithContext(
      `الآية: ${ayah}\nالشعور: ${emotion}\nحالة الوعي: ${STATE_LABELS[awarenessState]}\nتأمل المستخدم: ${reflection}\nأعطني JSON بالمفاتيح: insight, suggested_question, suggested_contemplation_practice`,
      [],
      "أنت Meaning Engine عربي. أعد JSON صحيح فقط، بدون شرح إضافي."
    );

    const parsed = JSON.parse(ai) as {
      insight?: string;
      suggested_question?: string;
      suggested_contemplation_practice?: string;
    };

    if (
      typeof parsed.insight === "string" &&
      typeof parsed.suggested_question === "string" &&
      typeof parsed.suggested_contemplation_practice === "string"
    ) {
      return NextResponse.json({
        ok: true,
        ...parsed,
        mode: "ai",
      });
    }
  } catch {
    // Fallback to deterministic engine.
  }

  return NextResponse.json({
    ok: true,
    ...local,
    mode: "fallback",
  });
}
