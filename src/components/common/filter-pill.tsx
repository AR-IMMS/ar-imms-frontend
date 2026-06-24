import { ChevronDown, Filter } from "lucide-react";

export default function FilterPill({ label }: { label: string }) {
  return (
    <button className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-surface-1 px-3 text-xs text-muted-foreground transition hover:border-cyan/30 hover:text-cyan-ice">
      <Filter className="size-3" />
      <span className="label-mono text-[10px]">{label}</span>
      <ChevronDown className="size-3" />
    </button>
  );
}