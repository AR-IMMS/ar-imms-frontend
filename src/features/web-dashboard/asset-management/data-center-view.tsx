"use client";

// import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Server, ZoomIn, ZoomOut, Move, RotateCcw } from "lucide-react";

// export const Route = createFileRoute("/topology")({
//   head: () => ({
//     meta: [
//       { title: "AR-IMMS // Infrastructure Topology" },
//       {
//         name: "description",
//         content:
//           "Holographic infrastructure topology visualizer for AR-IMMS micro data centers.",
//       },
//       { property: "og:title", content: "AR-IMMS // Infrastructure Topology" },
//       {
//         property: "og:description",
//         content:
//           "Live cluster, rack and grid views of mission-critical infrastructure.",
//       },
//     ],
//   }),
//   component: TopologyPage,
// });

type Status = "online" | "warning" | "critical" | "offline";

interface NodeT {
  id: string;
  ip: string;
  rack: string;
  status: Status;
  workload: string;
  cpu: number;
  ram: number;
  disk: number;
  anomaly: number;
  containers: {
    name: string;
    image: string;
    cpu: number;
    ram: number;
    state: Status;
  }[];
}

const STATUS_COLOR: Record<Status, string> = {
  online: "var(--cyber-green)",
  warning: "var(--cyber-warning)",
  critical: "var(--cyber-red)",
  offline: "var(--cyber-offline)",
};

const RACKS = ["R-01", "R-02", "R-03", "R-04"];
const WORKLOADS = ["edge-mesh", "ml-pipeline", "ingest", "gateway"];

function rand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const NODES: NodeT[] = (() => {
  const r = rand(7);
  const list: NodeT[] = [];
  for (let i = 0; i < 32; i++) {
    const v = r();
    const status: Status =
      v > 0.9
        ? "critical"
        : v > 0.78
          ? "warning"
          : v > 0.7
            ? "offline"
            : "online";
    const id = `NODE-${(1000 + i).toString().padStart(4, "0")}`;
    list.push({
      id,
      ip: `10.42.${Math.floor(i / 8) + 1}.${(i * 7 + 12) % 250}`,
      rack: RACKS[i % RACKS.length],
      status,
      workload: WORKLOADS[i % WORKLOADS.length],
      cpu: Math.floor(20 + r() * 75),
      ram: Math.floor(15 + r() * 80),
      disk: Math.floor(10 + r() * 70),
      anomaly: Math.round(r() * 100) / 100,
      containers: Array.from({ length: 2 + Math.floor(r() * 3) }).map(
        (_, ci) => ({
          name: `svc-${id.slice(-3)}-${ci}`,
          image: [
            "nginx:1.27",
            "redis:7.2",
            "ar-imms/agent:4.21",
            "postgres:16",
            "grafana:11",
          ][ci % 5],
          cpu: Math.floor(r() * 60 + 5),
          ram: Math.floor(r() * 70 + 10),
          state: r() > 0.85 ? "warning" : "online",
        }),
      ),
    });
  }
  return list;
})();

export function TopologyPage() {
  const [selected, setSelected] = useState<NodeT | null>(NODES[5]);
  const [zoom, setZoom] = useState(1);

  return (
    <div className="relative flex max-h-screen flex-col overflow-hidden text-foreground">
      <div className="relative z-10 flex flex-1 overflow-hidden">
        {/* CENTER WORKSPACE */}
        <main className="relative flex-1 overflow-hidden">
          <div className="absolute inset-0 holo-floor opacity-80" />
          <div className="absolute inset-0" />

          <div
            className="relative h-full w-full overflow-auto p-8"
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: "center top",
            }}
          >
              <RackView
                nodes={NODES}
                selected={selected}
                onSelect={setSelected}
              />
          </div>

          {/* Canvas controls */}
          <div className="absolute top-4 right-4 z-20 flex flex-col gap-1.5">
            <CanvasBtn
              onClick={() => setZoom((z) => Math.min(1.6, z + 0.1))}
              I={ZoomIn}
              label="Zoom in"
            />
            <CanvasBtn
              onClick={() => setZoom((z) => Math.max(0.6, z - 0.1))}
              I={ZoomOut}
              label="Zoom out"
            />
            <CanvasBtn onClick={() => setZoom(1)} I={RotateCcw} label="Reset" />
            <CanvasBtn onClick={() => {}} I={Move} label="Pan" />
          </div>

          {/* Minimap */}
          <div className="glass-panel absolute bottom-4 right-4 z-20 hidden h-32 w-48 overflow-hidden rounded-lg p-2 md:block">
            <div className="font-mono-tech mb-1 flex items-center justify-between text-[9px] uppercase tracking-[0.18em] text-ice/50">
              <span>Minimap</span>
              <span className="text-cyan">●</span>
            </div>
            <div className="relative h-[88px] w-full rounded bg-cyber-input holo-grid-sm">
              <div className="absolute inset-2 grid grid-cols-8 gap-0.5">
                {NODES.map((n) => (
                  <span
                    key={n.id}
                    className="h-1.5 w-1.5 rounded-[1px]"
                    style={{
                      background: STATUS_COLOR[n.status],
                      opacity: 0.85,
                    }}
                  />
                ))}
              </div>
              <div className="absolute inset-3 rounded border border-cyan/50" />
            </div>
          </div>

          {/* Coordinate readout */}
          <div className="font-mono-tech pointer-events-none absolute bottom-4 left-4 z-20 text-[10px] text-ice/40">
            ZOOM {zoom.toFixed(2)}× · X 0.00 Y 0.00 · GRID-LOCKED
          </div>
        </main>
      </div>
    </div>
  );
}

/* ============ Sub Components ============ */

function CanvasBtn({
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
      className="glass-panel flex h-9 w-9 items-center justify-center rounded-md text-ice transition-all hover:text-cyan"
      style={{ boxShadow: "var(--glow-cyan)" }}
    >
      <I className="h-4 w-4" />
    </button>
  );
}

/* ============ Views ============ */
function RackView({
  nodes,
  selected,
  onSelect,
}: {
  nodes: NodeT[];
  selected: NodeT | null;
  onSelect: (n: NodeT) => void;
}) {
  const racks = RACKS.map((r) => ({
    id: r,
    nodes: nodes.filter((n) => n.rack === r),
  }));
  return (
    <div className="mx-auto flex max-w-[1100px] flex-wrap items-end justify-center gap-6">
      {racks.map((rack) => (
        <div
          key={rack.id}
          className="relative w-56 cyber-border rounded-xl bg-cyber-panel/80 p-3"
          style={{
            boxShadow:
              "inset 0 0 60px rgba(0,217,255,0.06), 0 20px 50px -20px rgba(0,157,255,0.3)",
          }}
        >
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="text-display text-[11px] text-cyan">
                RACK {rack.id}
              </div>
              <div className="font-mono-tech text-[10px] text-ice/40">
                {rack.nodes.length} units
              </div>
            </div>
            <Server className="h-4 w-4 text-ice/50" />
          </div>
          <div className="space-y-1.5">
            {rack.nodes.map((n) => {
              const color = STATUS_COLOR[n.status];
              return (
                <button
                  key={n.id}
                  onClick={() => onSelect(n)}
                  className="group relative flex w-full items-center gap-2 rounded-md bg-cyber-input px-2 py-1.5 text-left transition-all hover:bg-cyber-elevated"
                  style={{
                    borderLeft: `2px solid ${color}`,
                    boxShadow:
                      selected?.id === n.id
                        ? `0 0 0 1px ${color}, 0 0 20px ${color}66`
                        : "none",
                  }}
                >
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full animate-cyber-pulse"
                    style={{
                      background: color,
                      color,
                      boxShadow: `0 0 6px ${color}`,
                    }}
                  />
                  <span className="font-mono-tech grow truncate text-[10px] text-ice/80">
                    {n.id}
                  </span>
                  <span className="font-mono-tech text-[9px] text-ice/40">
                    {n.cpu}%
                  </span>
                </button>
              );
            })}
            {Array.from({ length: Math.max(0, 10 - rack.nodes.length) }).map(
              (_, i) => (
                <div
                  key={i}
                  className="h-6 rounded-md border border-dashed border-cyan/10 bg-cyber-input/40"
                />
              ),
            )}
          </div>
          <div className="font-mono-tech mt-3 flex items-center justify-between text-[9px] text-ice/30">
            <span>PWR 240V</span>
            <span className="text-neon-green">ONLINE</span>
          </div>
        </div>
      ))}
    </div>
  );
}
