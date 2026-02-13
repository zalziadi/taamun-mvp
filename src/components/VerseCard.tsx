interface VerseCardProps {
  verse: string;
  reference: string;
}

export function VerseCard({ verse, reference }: VerseCardProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-6">
      <p className="text-lg leading-relaxed text-white">{verse}</p>
      <p className="mt-4 text-sm text-white/60">{reference}</p>
    </div>
  );
}
