export default function StatusChip({
  tone,
  label,
}: {
  tone: "healthy" | "warning" | "critical";
  label: string;
}) {
  const toneClasses = {
    healthy:
      "border-emerald-500/20 bg-emerald-500/5 text-emerald-400 ring-1 ring-emerald-500/10",
    warning:
      "border-amber-500/20 bg-amber-500/5 text-amber-400 ring-1 ring-amber-500/10",
    critical:
      "border-rose-500/20 bg-rose-500/5 text-rose-400 ring-1 ring-rose-500/10",
  } as const;

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.18em] ${toneClasses[tone]}`}
    >
      <span className="relative flex h-1.5 w-1.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-current"></span>
      </span>
      {label}
    </div>
  );
}
