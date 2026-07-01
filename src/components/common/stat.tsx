export default function Stat({
  icon,
  label,
  value,
  mono,
  tone,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
  tone?: string;
}) {
  return (
    <div className="panel p-3">
      <div className="flex justify-between items-center">
        <div className="label-mono text-[9px] text-muted-foreground">
          {label}
        </div>
        {icon && <div className="mb-1">{icon}</div>}
      </div>
      <div
        className={`mt-1 text-sm ${mono ? "font-mono" : ""} ${tone ?? "text-foreground"}`}
      >
        {value}
      </div>
    </div>
  );
}
