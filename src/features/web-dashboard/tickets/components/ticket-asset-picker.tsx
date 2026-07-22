"use client";

import { Box, Search, Server, X } from "lucide-react";
import { useMemo, useState } from "react";
import {
  useAssetSearchQuery,
  useTopologyTreeQuery,
} from "@/hooks/asset/use-asset-queries";
import type { TicketAssetReference } from "@/types/ticket";

type Props = {
  value: TicketAssetReference | null;
  onChange: (value: TicketAssetReference | null) => void;
};

export default function TicketAssetPicker({ value, onChange }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState("");
  const topologyQuery = useTopologyTreeQuery(expanded);
  const assetSearchQuery = useAssetSearchQuery(
    { q: query.trim() || undefined },
    expanded,
  );
  const options = useMemo(() => {
    const nodeParents = new Map(
      (topologyQuery.data ?? []).flatMap(({ rack, nodes }) =>
        nodes.map((node) => [
          node.id,
          { rackId: rack.id, rackCode: rack.rackCode },
        ] as const),
      ),
    );

    return (assetSearchQuery.data ?? [])
      .filter((asset) => asset.type === "rack" || asset.type === "node")
      .map((asset): TicketAssetReference => {
        const parent = asset.type === "node" ? nodeParents.get(asset.id) : null;
        return {
          type: asset.type === "rack" ? "RACK" : "NODE",
          assetId: asset.id,
          code: asset.code,
          displayName: asset.name,
          rackId: asset.type === "rack" ? asset.id : parent?.rackId,
          rackCode: asset.type === "rack" ? asset.code : parent?.rackCode,
        };
      })
      .slice(0, 30);
  }, [assetSearchQuery.data, topologyQuery.data]);

  if (value) {
    const Icon = value.type === "RACK" ? Server : Box;
    return (
      <div className="flex items-center gap-3 rounded-xl border border-cyan/35 bg-cyan/10 p-4">
        <div className="grid size-11 place-items-center rounded-lg bg-cyan/10"><Icon className="size-5 text-cyan" /></div>
        <div className="min-w-0 flex-1">
          <div className="label-mono text-[9px] text-cyan-ice">{value.type} · {value.code}</div>
          <div className="mt-1 truncate text-sm font-semibold text-foreground">{value.displayName}</div>
          {value.type === "NODE" && value.rackCode ? <div className="mt-1 font-mono text-[10px] text-muted-foreground">Inside {value.rackCode}</div> : null}
        </div>
        <button type="button" onClick={() => { onChange(null); setExpanded(true); }} aria-label="Remove related asset" className="rounded-lg border border-border p-2 text-muted-foreground transition hover:text-foreground"><X className="size-4" /></button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface-1 p-4">
      {!expanded ? (
        <button type="button" onClick={() => setExpanded(true)} className="flex w-full items-center gap-3 text-left">
          <div className="grid size-11 place-items-center rounded-lg border border-border bg-background/40"><Box className="size-4 text-muted-foreground" /></div>
          <div><div className="text-sm font-semibold text-foreground">Attach a rack or node</div><div className="mt-1 font-mono text-[10px] text-muted-foreground">Optional — leave empty for general tasks</div></div>
        </button>
      ) : (
        <div className="grid gap-3">
          <div className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} className="ticket-input pl-10" placeholder="Search rack or node..." /></div>
          <div className="max-h-52 overflow-y-auto rounded-lg border border-border bg-background/30">
            {assetSearchQuery.isLoading ? <div className="p-4 text-xs text-muted-foreground">Loading assets...</div> : assetSearchQuery.isError ? <div className="p-4 text-xs text-critical">Could not load Asset data. Check that asset-service is running and try again.</div> : options.length ? options.map((asset) => {
              const Icon = asset.type === "RACK" ? Server : Box;
              return <button key={`${asset.type}-${asset.assetId}`} type="button" onClick={() => { onChange(asset); setExpanded(false); }} className="flex w-full items-center gap-3 border-b border-border/50 px-3 py-3 text-left last:border-0 hover:bg-cyan/5"><Icon className="size-4 shrink-0 text-cyan" /><div className="min-w-0 flex-1"><div className="truncate text-sm font-medium text-foreground">{asset.displayName}</div><div className="font-mono text-[10px] text-muted-foreground">{asset.type} · {asset.code}{asset.type === "NODE" && asset.rackCode ? ` · ${asset.rackCode}` : ""}</div></div></button>;
            }) : <div className="p-4 text-xs text-muted-foreground">No rack or node found.</div>}
          </div>
          <button type="button" onClick={() => setExpanded(false)} className="text-left font-mono text-[10px] text-muted-foreground hover:text-foreground">Keep this ticket asset-free</button>
        </div>
      )}
    </div>
  );
}
