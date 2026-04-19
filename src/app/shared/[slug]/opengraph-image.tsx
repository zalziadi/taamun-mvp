import { ImageResponse } from "next/og";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const contentType = "image/png";
export const size = { width: 1200, height: 630 };
export const alt = "رؤية من تمعّن";

type Params = { params: Promise<{ slug: string }> };

// Fetch an Arabic font from Google Fonts (raw TTF) at build/render time.
// Cached per fetch by Next.js runtime. Using Amiri Regular + Amiri Bold.
async function loadFont(
  googleName: string,
  weight: "Regular" | "Bold"
): Promise<ArrayBuffer | null> {
  try {
    const cssUrl =
      `https://fonts.googleapis.com/css2?family=${googleName}:wght@` +
      (weight === "Bold" ? "700" : "400") +
      "&display=swap";
    const cssRes = await fetch(cssUrl, {
      headers: {
        // Ask for TTF format directly
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.0.0 Safari/537.36",
      },
    });
    if (!cssRes.ok) return null;
    const css = await cssRes.text();
    const urlMatch = css.match(/src:\s*url\(([^)]+)\)\s*format\('(?:truetype|opentype)'\)/);
    if (!urlMatch) return null;
    const fontRes = await fetch(urlMatch[1]);
    if (!fontRes.ok) return null;
    return await fontRes.arrayBuffer();
  } catch {
    return null;
  }
}

export default async function OgImage({ params }: Params) {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("shared_insights")
    .select("content, display_name")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  const content: string = data?.content ?? "تمعّن";
  const author: string = data?.display_name ?? "من تمعّن";

  const trimmed =
    content.length > 240 ? content.slice(0, 237).trim() + "…" : content;

  const [amiriRegular, notoBold] = await Promise.all([
    loadFont("Amiri", "Regular"),
    loadFont("Noto+Naskh+Arabic", "Bold"),
  ]);

  const fonts: {
    name: string;
    data: ArrayBuffer;
    weight: 400 | 700;
    style: "normal";
  }[] = [];
  if (amiriRegular) {
    fonts.push({ name: "Amiri", data: amiriRegular, weight: 400, style: "normal" });
  }
  if (notoBold) {
    fonts.push({
      name: "Noto Naskh Arabic",
      data: notoBold,
      weight: 700,
      style: "normal",
    });
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#fcfaf7",
          padding: "80px 100px",
          position: "relative",
          direction: "rtl",
        }}
      >
        {/* Top line */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
            fontFamily: "Noto Naskh Arabic, Amiri, serif",
            fontSize: 28,
            color: "#8c7851",
            fontWeight: 700,
          }}
        >
          <span>تمعّن</span>
          <span>رؤية</span>
        </div>

        {/* Content */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flex: 1,
            fontFamily: "Amiri, Noto Naskh Arabic, serif",
            fontSize: trimmed.length > 120 ? 46 : 58,
            lineHeight: 1.55,
            color: "#2f2619",
            textAlign: "center",
            fontWeight: 400,
          }}
        >
          {trimmed}
        </div>

        {/* Bottom line */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
            fontFamily: "Noto Naskh Arabic, Amiri, serif",
            fontSize: 24,
            color: "#8c7851",
            fontWeight: 400,
          }}
        >
          <span>— {author}</span>
          <span>taamun.com</span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: fonts.length > 0 ? fonts : undefined,
    }
  );
}
