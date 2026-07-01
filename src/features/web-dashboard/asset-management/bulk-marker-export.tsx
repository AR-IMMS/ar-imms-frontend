"use client";

import { useMemo, useState } from "react";
import { X, Download, FileImage, FileText, Sticker, Loader2 } from "lucide-react";
import { useTopologyTreeQuery } from "@/hooks/asset/use-asset-queries";
import { ArucoSVG } from "@/components/assets/aruco-svg";

type Fmt = "SVG" | "PNG" | "PDF";
type Size = "5x5" | "10x10";

export default function BulkMarkerExport({ onClose }: { onClose: () => void }) {
  const { data: topology = [], isLoading } = useTopologyTreeQuery();

  const all = useMemo(() => {
    return topology.flatMap((t) => {
      const r = t.rack;
      return t.nodes.map((node) => {
        const markerCode = (node.metadata?.markerCode as string) || `M-${node.nodeCode}`;
        return {
          id: node.id,
          name: node.displayName || node.nodeCode,
          ip: node.managementIp || "N/A",
          rackName: r.displayName || r.rackCode,
          siteCode: r.siteCode || "Unassigned Location",
          roomCode: r.roomCode || "Unassigned Room",
          marker: markerCode,
        };
      });
    });
  }, [topology]);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [fmt, setFmt] = useState<Fmt>("PDF");
  const [size, setSize] = useState<Size>("5x5");
  const [progress, setProgress] = useState<number | null>(null);

  // Initialize selection once data is loaded during render (avoids useEffect cascading renders)
  const [hasInitialized, setHasInitialized] = useState(false);
  if (!hasInitialized && all.length > 0) {
    setHasInitialized(true);
    setSelected(new Set(all.slice(0, 8).map((n) => n.id)));
  }

  function toggle(id: string) {
    setSelected((s) => {
      const ns = new Set(s);
      if (ns.has(id)) ns.delete(id);
      else ns.add(id);
      return ns;
    });
  }

  function toggleAll() {
    if (selected.size === all.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(all.map((n) => n.id)));
    }
  }

  function generate() {
    setProgress(0);
    const id = window.setInterval(() => {
      setProgress((p) => {
        if (p === null) return null;
        if (p >= 100) {
          window.clearInterval(id);
          return 100;
        }
        return p + 7;
      });
    }, 120);
  }

  const preview = all.filter((n) => selected.has(n.id)).slice(0, 6);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-background/70"
        style={{ backdropFilter: "blur(12px)" }}
        onClick={onClose}
      />
      <div className="relative w-full max-w-6xl glass rounded-2xl border border-cyan/30 p-6 shadow-[0_0_40px_rgba(0,209,255,0.15)] max-h-[92vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="label-mono text-[10px] text-cyan-ice font-semibold tracking-wider">
              AR / ArUco GENERATION SYSTEM
            </div>
            <div className="title-display text-lg text-foreground mt-1">Bulk Marker Export</div>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-white/5 transition">
            <X className="size-4 text-muted-foreground hover:text-foreground" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="size-8 text-cyan animate-spin" />
            <div className="text-xs font-mono text-muted-foreground">Loading topology nodes...</div>
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-5 animate-fade-in">
            <div className="col-span-12 lg:col-span-5 space-y-4">
              <div className="panel p-4 flex flex-col h-96">
                <div className="flex items-center justify-between mb-2 pb-2 border-b border-border/40">
                  <div className="label-mono text-[10px] text-cyan-ice">
                    Selection · {selected.size}/{all.length}
                  </div>
                  <button
                    onClick={toggleAll}
                    className="text-[9px] font-mono text-cyan-ice hover:text-cyan border-b border-cyan/30 hover:border-cyan transition"
                  >
                    {selected.size === all.length ? "Deselect All" : "Select All"}
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto divide-y divide-border/40 custom-scrollbar pr-1">
                  {all.map((n) => (
                    <label
                      key={n.id}
                      className="flex items-center gap-3 px-2 py-2 cursor-pointer hover:bg-cyan/5 rounded transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selected.has(n.id)}
                        onChange={() => toggle(n.id)}
                        className="accent-cyan size-3.5"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-mono text-xs text-foreground truncate">{n.name}</div>
                        <div className="font-mono text-[10px] text-muted-foreground truncate">
                          {n.rackName} · {n.ip}
                        </div>
                      </div>
                      <span className="label-mono text-[9px] text-cyan-ice bg-cyan/5 px-1.5 py-0.5 rounded border border-cyan/20">
                        {n.marker}
                      </span>
                    </label>
                  ))}
                  {all.length === 0 && (
                    <div className="text-center text-muted-foreground/45 font-mono text-xs py-10">
                      No nodes found in topology tree.
                    </div>
                  )}
                </div>
              </div>

              <div className="panel p-4 space-y-4">
                <div>
                  <div className="label-mono text-[10px] text-muted-foreground mb-2">Export Format</div>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        { k: "SVG" as Fmt, label: "SVG", icon: FileImage },
                        { k: "PNG" as Fmt, label: "PNG", icon: FileImage },
                        { k: "PDF" as Fmt, label: "PDF A4", icon: FileText },
                      ] as const
                    ).map(({ k, label, icon: Icon }) => (
                      <button
                        key={k}
                        onClick={() => setFmt(k)}
                        className={`p-2.5 rounded-md border text-center transition ${
                          fmt === k
                            ? "border-cyan/50 bg-cyan/10 text-cyan"
                            : "border-border bg-surface-1 text-muted-foreground hover:border-cyan/30"
                        }`}
                      >
                        <Icon className="size-4 mx-auto mb-1" />
                        <div className="label-mono text-[9px]">{label}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="label-mono text-[10px] text-muted-foreground mb-2">AR Overlay Size</div>
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      [
                        { k: "5x5" as Size, label: "Laptop Sticker 5×5cm" },
                        { k: "10x10" as Size, label: "Server Rack Plate 10×10cm" },
                      ] as const
                    ).map(({ k, label }) => (
                      <button
                        key={k}
                        onClick={() => setSize(k)}
                        className={`p-2.5 rounded-md border text-left text-xs transition ${
                          size === k
                            ? "border-cyan/50 bg-cyan/10 text-cyan"
                            : "border-border bg-surface-1 text-muted-foreground hover:border-cyan/30"
                        }`}
                      >
                        <Sticker className="size-3.5 inline mr-1" />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="col-span-12 lg:col-span-7">
              <div className="panel p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="label-mono text-[10px] text-cyan-ice">
                    A4 PRINT PREVIEW · {fmt} · {size}cm
                  </div>
                  <div className="font-mono text-[10px] text-muted-foreground">
                    {selected.size} stickers
                  </div>
                </div>
                <div
                  className="rounded-lg p-4 bg-[#0e1422] border border-border overflow-hidden flex flex-col justify-center"
                  style={{ aspectRatio: "1 / 1.414" }}
                >
                  <div className="grid grid-cols-2 gap-3 h-full overflow-y-auto custom-scrollbar p-1">
                    {preview.map((n) => (
                      <div
                        key={n.id}
                        className="bg-white rounded-md p-2 flex gap-2 items-stretch overflow-hidden border border-white"
                        style={{ contentVisibility: "auto" }}
                      >
                        <div className="w-16 shrink-0 grid place-items-center bg-zinc-50 rounded p-1">
                          <ArucoSVG seed={n.id} />
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-between font-mono text-[8px] leading-tight text-black">
                          <div>
                            <div className="text-[9px] font-bold truncate text-zinc-900">{n.name}</div>
                            <div className="truncate text-zinc-600">IP {n.ip}</div>
                            <div className="truncate text-zinc-600">{n.rackName}</div>
                            <div className="truncate text-zinc-500 font-semibold">{n.marker}</div>
                          </div>
                          <div className="text-[6px] uppercase tracking-wider text-black/50 border-t border-zinc-100 pt-1">
                            AR-IMMS · Security Tracker
                          </div>
                        </div>
                      </div>
                    ))}
                    {preview.length === 0 && (
                      <div className="col-span-2 grid place-items-center text-white/50 font-mono text-xs">
                        Select nodes to preview…
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={generate}
                  disabled={selected.size === 0}
                  className="mt-4 w-full rounded-lg px-3 py-3 text-xs label-mono bg-gradient-to-r from-cyan to-electric text-primary-foreground hover:shadow-[0_0_20px_rgba(0,209,255,0.4)] transition inline-flex items-center justify-center gap-2 disabled:opacity-50 relative overflow-hidden"
                >
                  {progress !== null && (
                    <div
                      className="absolute inset-y-0 left-0 bg-white/20 transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  )}
                  <Download className="size-3.5 relative" />
                  <span className="relative font-bold">
                    {progress === null
                      ? "Generate & Download Batch Asset Pack"
                      : progress >= 100
                      ? "✓ Asset Pack Ready"
                      : `Rendering markers… ${progress}%`}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}