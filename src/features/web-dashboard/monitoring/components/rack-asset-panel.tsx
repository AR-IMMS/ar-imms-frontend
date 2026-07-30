"use client";

import React, { useMemo } from "react";
import {
  Server,
  Compass,
  FileText,
  Settings,
  Clock,
  CheckCircle2,
  Activity,
  RefreshCcw,
} from "lucide-react";
import type { RackInvestigationOverviewResponse } from "@/types/monitoring";
import CopyableUserId from "@/components/common/copyable-user-id";
import Stat from "@/components/common/stat";
import { formatToExactDateTime } from "@/lib/utils/formatTime";

interface RackAssetPanelProps {
  overview: RackInvestigationOverviewResponse;
}

// Memoized Spatial Location Breadcrumbs component
const SpatialLocationChain = React.memo(
  ({
    siteCode,
    roomCode,
    rowCode,
    positionCode,
  }: {
    siteCode: string | null;
    roomCode: string | null;
    rowCode: string | null;
    positionCode: string | null;
  }) => {
    const locations = [
      { label: "Site", value: siteCode },
      { label: "Room", value: roomCode },
      { label: "Row", value: rowCode },
      { label: "Position", value: positionCode },
    ].filter((loc) => loc.value);

    return (
      <div className="space-y-2 pt-2">
        <div className="flex items-center gap-2 label-mono text-[10.5px] text-muted-foreground border-b border-border/80 pb-2">
          <Compass className="size-3.5 text-cyan-ice" /> SPATIAL LOCATION
        </div>
        <div className="px-2.5">
          {locations.length === 0 ? (
            <span className="text-[10px] text-slate-500 italic">
              No location coordinates mapped
            </span>
          ) : (
            <div className="flex flex-wrap items-center gap-1.5 font-mono text-[10px]">
              {locations.map((loc, idx) => (
                <React.Fragment key={loc.label}>
                  <div className="flex flex-col bg-slate-950/40 px-2 py-1 rounded border border-border/20">
                    <span className="text-[8px] text-center text-slate-500 uppercase">
                      {loc.label}
                    </span>
                    <span className="text-slate-200 text-[10px] text-center font-bold mt-0.5">
                      {loc.value}
                    </span>
                  </div>
                  {idx < locations.length - 1 && (
                    <span className="text-slate-600">➔</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  },
);
SpatialLocationChain.displayName = "SpatialLocationChain";

// Memoized Physical Specifications component
const RackPhysicalSpecs = React.memo(
  ({
    vendor,
    capacityLimit,
  }: {
    vendor: string | null;
    capacityLimit: number | null;
  }) => {
    return (
      <div className="space-y-2 pt-2">
        <div className="flex items-center gap-2 label-mono text-[10.5px] text-muted-foreground border-b border-border/80 pb-2">
          <Server className="size-3.5 text-cyan-ice" /> PHYSICAL SPECIFICATIONS
        </div>
        <div className="panel rounded bg-surface-1/40 mt-3 p-2.5 space-y-2.5">
          <div className="flex justify-between items-center text-[10.5px]">
            <span className="text-muted-foreground font-semibold uppercase">
              Vendor
            </span>
            <span
              className="text-foreground text-[10px] truncate max-w-[60%]"
              title={vendor || "N/A"}
            >
              {vendor || "--"}
            </span>
          </div>
          <div className="flex justify-between items-center text-[10.5px]">
            <span className="text-muted-foreground font-semibold uppercase">
              Capacity Limit
            </span>
            <span className="text-foreground text-[10px] font-bold">
              {capacityLimit ? `${capacityLimit} U` : "--"}
            </span>
          </div>
        </div>
      </div>
    );
  },
);
RackPhysicalSpecs.displayName = "RackPhysicalSpecs";

// Memoized Custom Metadata component
const CustomMetadataSection = React.memo(
  ({ metadata }: { metadata: Record<string, unknown> }) => {
    const keypairs = Object.entries(metadata);

    return (
      <div className="space-y-2 pt-2">
        <div className="flex items-center gap-2 label-mono text-[10.5px] text-muted-foreground border-b border-border/80 pb-2">
          <Settings className="size-3.5 text-cyan-ice" /> CUSTOM METADATA
        </div>
        <div className="panel rounded bg-surface-1/40 mt-3 p-2.5 space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
          {keypairs.length === 0 ? (
            <div className="text-[10px] text-slate-500 italic py-1">
              No custom metadata parameters
            </div>
          ) : (
            keypairs.map(([key, val]) => (
              <div
                key={key}
                className="flex justify-between items-start text-[10.5px] gap-2 border-b border-border/10 pb-1.5 last:border-0 last:pb-0"
              >
                <span
                  className="text-muted-foreground font-semibold uppercase truncate max-w-[45%]"
                  title={key}
                >
                  {key}
                </span>
                <span className="text-foreground text-[10px] break-all text-right max-w-[55%] font-semibold">
                  {typeof val === "object" ? JSON.stringify(val) : String(val)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    );
  },
);
CustomMetadataSection.displayName = "CustomMetadataSection";

export function RackAssetPanel({ overview }: RackAssetPanelProps) {
  const { rack, generatedAt } = overview;
  const { rackInfo, healthStatus, trend } = rack;

  const formattedUpdatedAt = useMemo(() => {
    return formatToExactDateTime(rackInfo.updatedAt);
  }, [rackInfo.updatedAt]);

  const formattedGeneratedAt = useMemo(() => {
    return formatToExactDateTime(generatedAt);
  }, [generatedAt]);

  const freshnessAgeText = useMemo(() => {
    const age = trend.lastChangeAgeSec;
    if (age === null || age === undefined) return "Never changed";
    if (age < 60) return `Last changed ${age}s ago`;
    const mins = Math.floor(age / 60);
    if (mins < 60) return `Last changed ${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    return `Last changed ${hrs}h ago`;
  }, [trend.lastChangeAgeSec]);

  return (
    <div className="w-[25%] glass h-full border-l border-border bg-background/50 backdrop-blur-md p-4 shrink-0 overflow-y-auto font-mono text-xs flex flex-col justify-start custom-scrollbar">
      <div className="space-y-5">
        {/* Header Display */}
        <div>
          <div className="label-mono text-[10px] text-cyan-ice uppercase tracking-wider">
            RACK ASSET CONTEXT
          </div>
          <div className="title-display mt-1 text-[1rem] text-foreground truncate max-w-70">
            {rackInfo.displayName || rackInfo.rackCode}
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-muted-foreground/60 text-[10px]">
              RACK ID:
            </span>
            <CopyableUserId value={rackInfo.id} className="text-[10px]" />
          </div>
          <div className="flex items-center gap-1.5 -mt-1">
            <span className="text-muted-foreground/60 text-[10px]">
              RACK CODE:
            </span>
            <CopyableUserId value={rackInfo.rackCode} className="text-[10px]" />
          </div>
        </div>

        {/* Triage Freshness State */}
        <div className="panel rounded bg-surface-1/40 p-3 mb-3 tracking-tight">
          <div className="flex justify-between items-center">
            <div className="text-muted-foreground font-semibold text-[10px] uppercase flex items-center gap-2">
              <RefreshCcw className="size-3 text-cyan-ice" /> Last Synced
            </div>
            <div className="flex flex-col items-end">
              <div className="text-foreground text-right font-semibold text-sm">
                {formattedUpdatedAt}
              </div>
            </div>
          </div>

          <span className="block h-0.5 bg-border/65 w-full my-2"></span>

          <div className="flex justify-between items-center">
            <div className="text-muted-foreground font-semibold text-[10px] uppercase flex items-center gap-2">
              <Activity className="size-3 text-cyan-ice" /> Generated At
            </div>
            <div className="flex flex-col items-end">
              <div className="text-foreground text-right font-semibold text-sm">
                {formattedGeneratedAt}
              </div>
              <div className="text-[10px] text-cyan uppercase font-bold">
                {freshnessAgeText}
              </div>
            </div>
          </div>
        </div>

        {/* State Badges Grid */}
        <div className="grid grid-cols-2 gap-2">
          <Stat
            label="LIFECYCLE STATE"
            value={rackInfo.lifecycleState || "--"}
            mono
            tone="text-cyan font-bold uppercase"
            themeConfig="bg-surface-1/40 rounded border border-border/20"
          />
          <Stat
            label="CAPACITY STATE"
            value={rackInfo.capacityState || "--"}
            mono
            tone="text-emerald-400 font-bold uppercase"
            themeConfig="bg-surface-1/40 rounded border border-border/20"
          />
        </div>

        {/* Spatial Location Breadcrumb Chain */}
        <SpatialLocationChain
          siteCode={rackInfo.siteCode}
          roomCode={rackInfo.roomCode}
          rowCode={rackInfo.rowCode}
          positionCode={rackInfo.positionCode}
        />

        {/* Physical Specs */}
        <RackPhysicalSpecs
          vendor={rackInfo.vendor}
          capacityLimit={rackInfo.capacityLimit}
        />

        {/* Operational Notes */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center gap-2 label-mono text-[10.5px] text-muted-foreground border-b border-border/80 pb-2">
            <FileText className="size-3.5 text-cyan-ice" /> OPERATIONAL NOTES
          </div>
          <div className="panel p-2.5 bg-surface-1/40 rounded text-[9.5px] leading-relaxed text-slate-300 italic border border-border/20 min-h-16">
            {rackInfo.notes || "No operational notes"}
          </div>
        </div>

        {/* Custom Metadata parameters */}
        <CustomMetadataSection metadata={rackInfo.metadata} />
      </div>

    </div>
  );
}
