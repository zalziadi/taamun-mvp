"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ActivatePage() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleActivate() {
    setError("");

    const trimmed = code.trim().toUpperCase();

    if (!trimmed) {
      setError("أدخل كود التفعيل");
      return;
    }

    try {
      const res = await fetch(
        `/api/activate?code=${encodeURIComponent(trimmed)}`,
        { method: "GET" }
      );

      const data = await res.json();

      if (data.ok) {
        router.push("/day/1");
      } else {
        setError("الكود غير موجود");
      }
    } catch (e) {
      setError("حدث خطأ غير متوقع");
    }
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-xl mb-4">تفعيل الاشتراك</h1>

      <input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="أدخل كود التفعيل"
        className="border p-2 w-full mb-3"
      />

      {error && (
        <div className="text-red-500 mb-3">{error}</div>
      )}

      <button
        onClick={handleActivate}
        className="bg-yellow-500 text-black px-4 py-2 w-full"
      >
        تفعيل الآن
      </button>
    </div>
  );
}
