"use client";

import { useState } from "react";
import { DATA, STATUS_DOT } from "../lib/constant";
import { DC, NodeAsset, Rack } from "@/types/assets";
import {
  ChevronRight,
  ChevronDown,
  Server,
  Search,
  Database,
} from "lucide-react";

type Selection =
  | { kind: "dc"; dc: DC }
  | { kind: "rack"; dc: DC; rack: Rack }
  | { kind: "node"; dc: DC; rack: Rack; node: NodeAsset };

export default function HierarchicalTreeSidebar() {
  const [sel, setSel] = useState<Selection>({
    kind: "rack",
    dc: DATA[0],
    rack: DATA[0].racks[0],
  });
  const [openDC, setOpenDC] = useState<Record<string, boolean>>({
    "dc-01": true,
  });
  const [openRack, setOpenRack] = useState<Record<string, boolean>>({
    "rk-a01": true,
  });

  return (
    <div className="panel p-4 space-y-4 h-full flex flex-col overflow-hidden">
      <div className="flex items-center gap-2 px-2 h-9 rounded-md bg-surface-1 border border-border shrink-0">
        <Search className="size-3.5 text-muted-foreground" />
        <input
          placeholder="ID or IP..."
          className="flex-1 bg-transparent outline-none text-xs font-mono placeholder:text-muted-foreground/60"
        />
      </div>

      <div className="label-mono text-[10px] text-muted-foreground px-2 mb-2">
        Topology Tree
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar space-y-1 font-mono text-xs pr-1">
        {DATA.map((dc) => {
          const dcOpen = !!openDC[dc.id];
          const dcActive = sel.kind === "dc" && sel.dc.id === dc.id;
          return (
            <div key={dc.id} className="w-full">
              <div className="flex items-center w-full min-w-0">
                <button
                  onClick={() =>
                    setOpenDC((o) => ({ ...o, [dc.id]: !o[dc.id] }))
                  }
                  className="p-1 shrink-0 text-muted-foreground hover:text-cyan-ice"
                >
                  {dcOpen ? (
                    <ChevronDown className="size-3" />
                  ) : (
                    <ChevronRight className="size-3" />
                  )}
                </button>

                <button
                  onClick={() => setSel({ kind: "dc", dc })}
                  className={`flex-1 text-left px-2 py-1.5 rounded flex items-center gap-2 min-w-0 ${
                    dcActive
                      ? "bg-cyan/10 text-cyan border border-cyan/30"
                      : "text-foreground hover:bg-white/[0.03] border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2 w-full min-w-0">
                    <Database className="size-3.5 text-purple shrink-0" />
                    <span className="truncate flex-1">{dc.name}</span>
                  </div>
                </button>
              </div>

              {dcOpen && (
                <div className="ml-5 border-l border-border/60 pl-2 space-y-0.5 mt-0.5">
                  {dc.racks.map((rack) => {
                    const rOpen = !!openRack[rack.id];
                    const rActive =
                      sel.kind === "rack" && sel.rack.id === rack.id;
                    return (
                      <div key={rack.id} className="w-full">
                        <div className="flex items-center w-full min-w-0">
                          <button
                            onClick={() =>
                              setOpenRack((o) => ({
                                ...o,
                                [rack.id]: !o[rack.id],
                              }))
                            }
                            className="p-1 shrink-0 text-muted-foreground hover:text-cyan-ice"
                          >
                            {rOpen ? (
                              <ChevronDown className="size-3" />
                            ) : (
                              <ChevronRight className="size-3" />
                            )}
                          </button>

                          <button
                            onClick={() => setSel({ kind: "rack", dc, rack })}
                            className={`flex-1 text-left px-2 py-1 rounded flex items-center gap-2 min-w-0 ${
                              rActive
                                ? "bg-cyan/10 text-cyan border border-cyan/30"
                                : "text-foreground hover:bg-white/[0.03] border border-transparent"
                            }`}
                          >
                            <div className="flex items-center gap-2 w-full min-w-0">
                              <Server className="size-3.5 text-cyan-ice shrink-0" />
                              <span className="truncate flex-1">
                                {rack.name}
                              </span>
                              <span className="ml-auto shrink-0 label-mono text-[9px] text-muted-foreground pl-1">
                                {rack.nodes.length}/{rack.slots}
                              </span>
                            </div>
                          </button>
                        </div>

                        {rOpen && (
                          <div className="ml-5 border-l border-border/60 pl-2 space-y-0.5 py-1">
                            {rack.nodes.map((n) => {
                              const active =
                                sel.kind === "node" && sel.node.id === n.id;
                              return (
                                <button
                                  key={n.id}
                                  onClick={() =>
                                    setSel({
                                      kind: "node",
                                      dc,
                                      rack,
                                      node: n,
                                    })
                                  }
                                  className={`w-full flex items-center gap-2 px-2 py-1 rounded text-left min-w-0 ${
                                    active
                                      ? "bg-cyan/10 text-cyan border border-cyan/30"
                                      : "text-muted-foreground hover:bg-white/[0.03] hover:text-foreground border border-transparent"
                                  }`}
                                >
                                  <div className="flex items-center gap-2 w-full min-w-0">
                                    <span
                                      className={`size-1.5 rounded-full shrink-0 ${STATUS_DOT[n.status]}`}
                                    />
                                    <span className="truncate text-[11px] flex-1">
                                      {n.name}
                                    </span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
