export function Tooltip({
  children,
  content,
  enabled,
}: {
  children: React.ReactNode;
  content: string;
  enabled: boolean;
}) {
  if (!enabled) return <>{children}</>;
  return (
    <div className="group relative flex items-center justify-center w-full">
      {children}
      <div className="pointer-events-none absolute left-full z-50 ml-3 flex items-center opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 ease-out">
        {/* Triangle arrow */}
        <div className="h-0 w-0 border-y-[5px] border-y-transparent border-r-[5px] border-r-cyan/30" />
        {/* Tooltip box */}
        <div className="rounded-md border border-cyan/30 bg-surface-2/95 light:bg-primary px-2.5 py-1 text-[9px] font-mono tracking-wider text-cyan-ice light:text-background light:font-bold shadow-[0_0_15px_rgba(0,209,255,0.25)] backdrop-blur-md whitespace-nowrap uppercase">
          {content}
        </div>
      </div>
    </div>
  );
}
