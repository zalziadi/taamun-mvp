import { NextResponse } from "next/server";
import { ImageAnnotatorClient } from "@google-cloud/vision";

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

function checkAuth(request: Request): { ok: boolean; error?: string } {
  const entitlement = request.headers.get("X-Taamun-Entitlement") ?? "";
  const plan820 = request.headers.get("X-Taamun-Plan-820") === "1";
  if (entitlement !== "active") {
    return { ok: false, error: "الاشتراك غير مفعّل" };
  }
  if (!plan820) {
    return { ok: false, error: "باقة 820 مطلوبة" };
  }
  return { ok: true };
}

export async function POST(request: Request) {
  try {
    const auth = checkAuth(request);
    if (!auth.ok) {
      return NextResponse.json({ ok: false, error: auth.error }, { status: 403 });
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
