import { NextResponse } from "next/server";
import { ImageAnnotatorClient } from "@google-cloud/vision";
import { requireUser } from "@/lib/authz";

export const dynamic = "force-dynamic";

function getVisionClient(): ImageAnnotatorClient | null {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
  const clientEmail = process.env.GOOGLE_CLOUD_CLIENT_EMAIL;
  const privateKeyRaw = process.env.GOOGLE_CLOUD_PRIVATE_KEY;
  if (!projectId || !clientEmail || !privateKeyRaw) return null;
  const privateKey = privateKeyRaw.replace(/\\n/g, "\n");
  return new ImageAnnotatorClient({
    credentials: { client_email: clientEmail, private_key: privateKey },
    projectId,
  });
}

export async function POST(request: Request) {
  try {
    const auth = await requireUser();
    if (!auth.ok) return auth.response;

    const { supabase, user } = auth;
    const { data: entitlement, error: entitlementError } = await supabase
      .from("entitlements")
      .select("status, plan")
      .eq("user_id", user.id)
      .eq("status", "active")
      .limit(1)
      .maybeSingle();

    if (entitlementError) {
      return NextResponse.json({ ok: false, error: "تعذر التحقق من الاشتراك" }, { status: 500 });
    }
    if (!entitlement) {
      return NextResponse.json({ ok: false, error: "الاشتراك غير مفعّل" }, { status: 403 });
    }
    if (String(entitlement.plan ?? "").toLowerCase() !== "plan820") {
      return NextResponse.json({ ok: false, error: "باقة 820 مطلوبة" }, { status: 403 });
    }
    const formData = await request.formData();
    const file = formData.get("image");
    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { ok: false, error: "صورة مطلوبة" },
        { status: 400 }
      );
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const client = getVisionClient();
    if (!client) {
      return NextResponse.json(
        { ok: false, error: "إعدادات OCR غير مكتملة" },
        { status: 500 }
      );
    }
    const [result] = await client.documentTextDetection({
      image: { content: buffer },
    });
    const text = result.fullTextAnnotation?.text?.trim() ?? "";
    if (!text) {
      return NextResponse.json(
        { ok: false, error: "لم يُستخرج أي نص من الصورة" },
        { status: 200 }
      );
    }
    return NextResponse.json({ ok: true, text });
  } catch (err) {
    console.error("[scan] OCR error:", err);
    const message = err instanceof Error ? err.message : "خطأ غير متوقع";
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}
