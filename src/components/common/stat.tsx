export default function Stat({
  label,
  value,
  mono,
  tone,
}: {
  label: string;
  value: string;
  mono?: boolean;
  tone?: string;
}) {
  return (
    <div className="panel p-3">
      <div className="label-mono text-[9px] text-muted-foreground">{label}</div>
      <div
        className={`mt-1 text-sm ${mono ? "font-mono" : ""} ${tone ?? "text-foreground"}`}
      >
        {value}
      </div>
    </div>
  );
}