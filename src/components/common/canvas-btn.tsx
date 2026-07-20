export function CanvasBtn({
  onClick,
  I,
  label,
}: {
  onClick: () => void;
  I: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="glass flex h-10 w-10 items-center justify-center rounded-xl text-cyan-ice hover:text-cyan border border-cyan/20 hover:border-cyan/50 shadow-[0_0_10px_rgba(0,209,255,0.05)] transition-all cursor-pointer bg-background/80 hover:bg-background"
    >
      <I className="h-4 w-4" />
    </button>
  );
}
