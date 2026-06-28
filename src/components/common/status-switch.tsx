import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { UserStatus } from "@/types/auth";

type StatusSwitchProps = {
  status: UserStatus;
  onCheckedChange?: (checked: boolean) => void;
};

export default function StatusSwitch({
  status,
  onCheckedChange,
}: StatusSwitchProps) {
  const on = status === "ACTIVE";
  const locked = status === "LOCKED";

  return (
    <div className="flex items-center gap-2">
      <Switch
        checked={on}
        disabled={locked}
        onClick={(event) => event.stopPropagation()}
        onCheckedChange={onCheckedChange}
        aria-label={`Status ${status}`}
        className={cn(
          "h-5 w-9 border",
          on
            ? "border-neon-green/60 bg-neon-green/30 shadow-[0_0_10px_rgba(0,255,156,0.35)] data-[state=checked]:bg-neon-green/30 data-[state=unchecked]:bg-neon-green/30"
            : "border-white/10 bg-white/5 data-[state=checked]:bg-white/5 data-[state=unchecked]:bg-white/5",
          locked && "cursor-not-allowed opacity-75",
        )}
      />
      <span
        className={`label-mono text-[10px] ${
          on
            ? "text-neon-green"
            : status === "LOCKED"
              ? "text-amber"
              : "text-muted-foreground"
        }`}
      >
        {status}
      </span>
    </div>
  );
}
