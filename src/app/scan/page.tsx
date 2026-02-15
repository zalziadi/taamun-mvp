"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ScanGate, ocrImage, setScanAyahText } from "../../features/scan";
import { StatusCard } from "../../components/StatusCard";

export default function ScanPage() {
  const router = useRouter();
  const [extractedText, setExtractedText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setSelectedFile(file ?? null);
    setError(null);
  };

  const handleExtract = async () => {
    if (!selectedFile) return;
    setError(null);
    setLoading(true);
    try {
      const { text } = await ocrImage(selectedFile);
      setExtractedText(text);
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطأ في الاتصال بالسيرفر");
    } finally {
      setLoading(false);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleStartContemplation = () => {
    const text = extractedText.trim();
    if (!text) return;
    setScanAyahText(text);
    router.push("/day?mode=scan");
  };

  return (
    <ScanGate>
      <div className="min-h-screen bg-[#0B0F14] p-6">
        <nav className="mb-8 flex gap-4">
          <Link href="/" className="text-white/70 hover:text-white">
            الرئيسية
          </Link>
          <Link href="/day" className="text-white/70 hover:text-white">
            اليوم
          </Link>
        </nav>

        <h1 className="mb-8 text-2xl font-bold text-white">التقاط آية</h1>

        <div className="max-w-md space-y-6">
          <div>
            <label
              htmlFor="scan-file"
              className="mb-2 block cursor-pointer rounded-lg border border-white/20 bg-white/5 p-4 text-center text-white/90 transition-colors hover:bg-white/10"
            >
              اختر صورة
            </label>
            <input
              id="scan-file"
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={handleExtract}
              disabled={!selectedFile || loading}
              className="mt-2 w-full rounded-lg border border-white/20 bg-white/10 px-6 py-3 text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              استخراج النص
            </button>
          </div>

          {loading && <p className="text-white/70">جاري استخراج النص...</p>}
          {error && (
            <StatusCard title="خطأ" message={error} variant="warning" />
          )}

          <div>
            <label htmlFor="extracted" className="mb-2 block text-white/90">
              النص المستخرج (يمكنك التعديل)
            </label>
            <textarea
              id="extracted"
              value={extractedText}
              onChange={(e) => setExtractedText(e.target.value)}
              rows={5}
              className="w-full rounded-lg border border-white/20 bg-white/5 p-3 text-white placeholder:text-white/40"
              placeholder="سيظهر النص هنا بعد الاستخراج..."
            />
          </div>

          <button
            type="button"
            onClick={handleStartContemplation}
            disabled={!extractedText.trim()}
            className="w-full rounded-lg bg-white px-6 py-3 font-medium text-[#0B0F14] disabled:cursor-not-allowed disabled:opacity-40"
          >
            ابدأ التمعّن
          </button>
        </div>
      </div>
    </ScanGate>
  );
}
