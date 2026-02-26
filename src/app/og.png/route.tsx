import { ImageResponse } from "next/og";
import { APP_NAME } from "@/lib/appConfig";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "#f6f1e7",
          color: "#2a2118",
          fontFamily: "serif",
          textAlign: "center",
          padding: "48px",
        }}
      >
        <div style={{ fontSize: 76, fontWeight: 700, marginBottom: 16 }}>{APP_NAME}</div>
        <div style={{ fontSize: 34, opacity: 0.9 }}>رحلة 28 يومًا</div>
        <div style={{ fontSize: 24, marginTop: 24, opacity: 0.75 }}>
          {`مراقبة → إدراك → ${APP_NAME}`}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
