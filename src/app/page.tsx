import TaamunEssential from "@/components/taamun/TaamunEssential";

type HomePageProps = {
  searchParams?: {
    ramadan?: string;
  };
};

export default function HomePage({ searchParams }: HomePageProps) {
  const isRamadanClosed = searchParams?.ramadan === "closed";

  return (
    <div className="space-y-4">
      {isRamadanClosed ? (
        <div className="mx-auto mt-4 w-full max-w-[1080px] rounded-2xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-gold">
          تم إيقاف برنامج رمضان (٢٨ يوم) مؤقتًا، وسيعود لاحقًا ضمن العضويات المدفوعة. تم تحويلك للواجهة الرئيسية.
        </div>
      ) : null}
      <TaamunEssential />
    </div>
  );
}
