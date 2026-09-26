/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // مسار التحميل يقرأ فصول الكتاب من القرص وقت التشغيل — اضمنها في حزمة Vercel
    outputFileTracingIncludes: {
      "/api/guide/ingest": ["./src/content/book/madinat-almana/**"],
    },
  },
  async redirects() {
    return [
      // عرض العيدية الموسمي انتهى — الأسعار المعتمدة في /pricing (قرار 2026-07-22)
      { source: "/eid", destination: "/pricing", permanent: true },
    ];
  },
};

export default nextConfig;
