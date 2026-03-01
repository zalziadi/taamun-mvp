import { APP_NAME } from "@/lib/appConfig";

export function LandingMerged() {
  return (
    <section className="container py-16">
      <h1 className="text-3xl font-bold text-gold">مرحبًا بك في {APP_NAME}</h1>
      <p className="mt-4 text-muted">
        الصفحة الرئيسية تعمل الآن بنجاح. يمكنك تخصيص المحتوى لاحقًا.
      </p>
    </section>
  );
}
