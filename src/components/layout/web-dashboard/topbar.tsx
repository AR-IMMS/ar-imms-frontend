"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronDown, Hexagon } from "lucide-react";
import { useAuth } from "@/hooks/auth/use-auth";
import { getRoleName } from "@/lib/utils/roleConverter";

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
  const { user } = useAuth();

  return (
    <header
      className="glass sticky top-0 z-30 flex h-15 items-center justify-between border-b border-sidebar-border px-4 sm:px-6"
      style={{
        background: "rgba(8, 18, 35, 0.95)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(0, 217, 255, 0.15)",
      }}
    >
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
            <div className="label-mono text-[9px] text-cyan-ice/70">
              Command Center · V1.0.0
            </div>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden flex-col items-end leading-tight md:flex">
          <div className="font-mono text-sm tabular-nums text-cyan text-glow-cyan">
            {time}{" "}
            <span className="ml-1 text-[10px] text-muted-foreground">
              Viet Nam
            </span>
          </div>
          <div className="label-mono text-[10px] tabular-nums text-muted-foreground">
            {date} · SYNCED
          </div>
        </div>

        <div className="flex items-center gap-2 border-l border-cyan/15 pl-3">
          <div className="grid size-8 place-items-center rounded-md bg-linear-to-br from-cyan to-purple text-[11px] font-bold text-primary-foreground">
            {user?.username?.substring(0, 2).toUpperCase() || "N/A"}
          </div>
          <div className="hidden md:block leading-tight">
            <div className="text-xs font-medium text-foreground">
              {user?.username || "N/A"}
            </div>
            <div className="label-mono text-[9px] text-muted-foreground">
              {getRoleName(user?.roleCodes?.[0]) || "N/A"}
            </div>
          </div>
          <ChevronDown className="size-3.5 text-muted-foreground" />
        </div>
      </div>
    </header>
  );
}
