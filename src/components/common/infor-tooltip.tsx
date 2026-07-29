import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { Info } from "lucide-react";

export function InfoTooltip({ content }: { content: string }) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const iconRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (iconRef.current) {
      const rect = iconRef.current.getBoundingClientRect();
      setCoords({
        top: rect.top - 8,
        left: rect.left,
      });
      setVisible(true);
    }
  };

  const handleMouseLeave = () => {
    setVisible(false);
  };

  return (
    <div
      ref={iconRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="inline-block relative"
    >
      <Info className="size-3 text-slate-500 hover:text-cyan cursor-pointer transition-colors" />
      {visible &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            style={{
              position: "fixed",
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              transform: "translate(-90%, -100%)", // Float up and left to overlap adjacent leftward viewport
            }}
            className="pointer-events-none z-50 w-55 bg-surface-2/95 light:bg-primary light:font-bold border border-cyan/30 rounded p-2.5 shadow-[0_0_15px_rgba(0,209,255,0.25)] backdrop-blur-md animate-in fade-in zoom-in-95 duration-150"
          >
            {/* Arrow pointer targeting the info icon */}
            <p className="text-[10px] text-foreground/80 font-sans leading-normal whitespace-pre-wrap">
              {content}
            </p>
          </div>,
          document.body,
        )}
    </div>
  );
}