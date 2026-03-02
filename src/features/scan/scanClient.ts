/** Client helper: call OCR API and return extracted text */
export async function ocrImage(file: File): Promise<{ text: string }> {
  const formData = new FormData();
  formData.append("image", file);

  const res = await fetch("/api/scan", {
    method: "POST",
    body: formData,
  });

  if (res.status === 403) {
    const data = (await res.json()) as { ok?: boolean; error?: string };
    throw new Error(data.error ?? "غير مصرح");
  }
  const data = (await res.json()) as { ok: boolean; text?: string; error?: string };
  if (data.ok && typeof data.text === "string") {
    return { text: data.text };
  }
  throw new Error(data.error ?? "فشل استخراج النص");
}
