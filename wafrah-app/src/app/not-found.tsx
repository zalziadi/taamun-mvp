import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-24 text-center">
      <p className="text-xs font-medium text-wafrah-700">404</p>
      <h1 className="mt-3 text-3xl font-semibold text-ink-900">الصفحة غير موجودة</h1>
      <p className="mt-3 text-sm text-ink-600">انتهت إلى مكان لا يقود إلى رحلتك.</p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-ink-900 px-5 py-2.5 text-sm font-semibold text-white"
      >
        العودة للبداية ←
      </Link>
    </div>
  );
}
