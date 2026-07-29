export default function Stat({
  icon,
  label,
  value,
  mono,
  tone,
  themeConfig,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
  tone?: string;
  themeConfig?: string;
}) {
  return (
    <div className={`panel ${themeConfig || "light:bg-muted"} p-3`}>
      <div className="flex justify-between items-center h-4">
        <div className="label-mono text-[9px] text-muted-foreground light:font-bold">
          {label}
        </div>
        {icon ? (
          <div className="flex items-center">{icon}</div>
        ) : (
          <div className="w-3 h-3 invisible" />
        )}
      </div>
      <div
        className={`mt-1 text-sm ${mono ? "font-mono" : ""} ${tone ?? "text-foreground"}`}
      >
        {value}
      </div>
    </div>
  );
}
