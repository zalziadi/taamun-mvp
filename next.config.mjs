/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      // عرض العيدية الموسمي انتهى — الأسعار المعتمدة في /pricing (قرار 2026-07-22)
      { source: "/eid", destination: "/pricing", permanent: true },
    ];
  },
};

export default nextConfig;
