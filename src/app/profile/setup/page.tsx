import BirthDataForm from "@/components/gene-keys/BirthDataForm";

export const metadata = {
  title: "خريطتك الجينية — تمعّن",
};

export default function ProfileSetupPage() {
  return (
    <main
      dir="rtl"
      className="min-h-screen flex flex-col items-center justify-center px-6 py-12"
      style={{ backgroundColor: "#0a0a0a" }}
    >
      {/* الرسالة */}
      <div className="text-center mb-10 max-w-md">
        <h1
          className="text-2xl md:text-3xl font-bold mb-4 leading-relaxed"
          style={{ color: "#c9a96e", fontFamily: "Amiri, serif" }}
        >
          خريطتك الجينية هي مرآة روحك
        </h1>
        <p className="text-[#cdc6b7] text-base leading-relaxed">
          ندخل منها لنفهم أنماطك العميقة — ظلالك، هداياك، وأعلى احتمالاتك.
          <br />
          أدخل بيانات ميلادك وسيرسم لك المرشد خريطة فريدة.
        </p>
      </div>

      {/* الفورم */}
      <BirthDataForm />

      {/* ملاحظة الخصوصية */}
      <p className="text-xs text-[#969083] mt-8 max-w-sm text-center">
        بياناتك محفوظة بأمان ولا تُشارك مع أي طرف. تُستخدم فقط لحساب خريطتك الجينية.
      </p>
    </main>
  );
}
