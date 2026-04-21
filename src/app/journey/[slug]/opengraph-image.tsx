import { ImageResponse } from "next/og";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const contentType = "image/png";
export const size = { width: 1200, height: 630 };
export const alt = "رحلة من تمعّن";

type Params = { params: Promise<{ slug: string }> };

/**
 * Fetch a Google Font TTF at request-time (canonical next/og pattern —
 * next/font is not usable inside ImageResponse).
 */
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
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.0.0 Safari/537.36",
      },
    });
    if (!cssRes.ok) return null;
    const css = await cssRes.text();
    const urlMatch = css.match(
      /src:\s*url\(([^)]+)\)\s*format\('(?:truetype|opentype)'\)/
    );
    if (!urlMatch) return null;
    const fontRes = await fetch(urlMatch[1]);
    if (!fontRes.ok) return null;
    return await fontRes.arrayBuffer();
  } catch {
    return null;
  }
}

export default async function JourneyOg({ params }: Params) {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("creator_journeys")
    .select("title, description, duration_days, creator_display_name, subscriber_count, status")
    .eq("slug", slug)
    .maybeSingle();

  const title =
    (data?.status === "published" ? (data?.title as string) : null) ?? "رحلة";
  const creator =
    (data?.creator_display_name as string | undefined) ?? "تمعّن";
  const duration = (data?.duration_days as number | undefined) ?? 7;
  const subs = (data?.subscriber_count as number | undefined) ?? 0;

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
          direction: "rtl",
        }}
      >
        {/* Header row */}
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
          <span>رحلة {duration} يوم</span>
        </div>

        {/* Title */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            flex: 1,
            fontFamily: "Amiri, Noto Naskh Arabic, serif",
            color: "#2f2619",
            textAlign: "right",
          }}
        >
          <div
            style={{
              fontSize: title.length > 60 ? 52 : 68,
              lineHeight: 1.3,
              fontWeight: 700,
              fontFamily: "Noto Naskh Arabic, Amiri, serif",
            }}
          >
            {title.length > 100 ? title.slice(0, 97).trim() + "…" : title}
          </div>
        </div>

        {/* Footer row */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
            fontFamily: "Noto Naskh Arabic, Amiri, serif",
            fontSize: 26,
            color: "#5a4a35",
            fontWeight: 400,
          }}
        >
          <span>بقلم {creator}</span>
          <span>
            {subs > 0 ? `${subs} مشترك` : "رحلة جديدة"} · taamun.com
          </span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: fonts.length > 0 ? fonts : undefined,
    }
  );
}
