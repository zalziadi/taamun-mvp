interface StatusCardProps {
  title: string;
  message: string;
  variant?: "info" | "success" | "warning";
}

export function StatusCard({ title, message, variant = "info" }: StatusCardProps) {
  const bgClass =
    variant === "success"
      ? "bg-emerald-500/20 border-emerald-500/40"
      : variant === "warning"
        ? "bg-amber-500/20 border-amber-500/40"
        : "bg-white/10 border-white/20";

  return (
    <div className={`rounded-xl border p-4 ${bgClass}`}>
      <p className="font-medium text-white">{title}</p>
      <p className="mt-1 text-sm text-white/80">{message}</p>
    </div>
  );
}
