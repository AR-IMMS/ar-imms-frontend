"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Hexagon } from "lucide-react";
import { UserDropdown } from "./user-dropdown";

function useCurrentTime() {
  const [t, setT] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setT(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const pad = (n: number) => n.toString().padStart(2, "0");
  const time = `${pad(t.getHours())}:${pad(t.getMinutes())}:${pad(t.getSeconds())}`;
  const date = `${t.getFullYear()}.${pad(t.getMonth() + 1)}.${pad(t.getDate())}`;
  return { time, date };
}

export default function TopBar() {
  const { time, date } = useCurrentTime();

  return (
    <header className="glass sticky top-0 z-30 flex h-15 items-center justify-between border-b border-sidebar-border px-4 sm:px-6">
      <div className="flex items-center gap-6">
        <Link
          href="/"
          className="flex items-center gap-3 transition hover:opacity-90"
        >
          <div className="relative grid size-9 place-items-center rounded-md border border-cyan/40 bg-surface-2">
            <Hexagon className="size-5 text-cyan" />
            <span className="pointer-events-none absolute inset-0 rounded-md shadow-[0_0_18px_rgba(0,217,255,0.45)]" />
          </div>
          
          <div className="leading-tight">
            <div className="title-display text-[15px] text-cyan text-glow-cyan">
              AR-IMMS
            </div>
            <div className="label-mono text-[9px] text-cyan-ice/70 light:text-foreground/70">
              Command Center · V1.0.0
            </div>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden flex-col items-end leading-tight md:flex">
          <div className="font-mono text-sm tabular-nums text-cyan text-glow-cyan light:font-bold">
            {time} {" "}
            <span className="ml-1 text-[10px] text-muted-foreground">
              Viet Nam
            </span>
          </div>
          <div className="label-mono text-[10px] tabular-nums text-muted-foreground light:text-foreground/65">
            {date} · SYNCED
          </div>
        </div>

        <UserDropdown />
      </div>
    </header>
  );
}
