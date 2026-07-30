"use client";

import { RackHeaderTriage } from "./components/rack-header-triage";
import { RackAggregateGrid } from "./components/rack-aggregate-grid";
import { RackBlastAlertsTriage } from "./components/rack-blast-alerts-triage";
import { RackProblemNodeGrid } from "./components/rack-problem-node-grid";
import type { RackInvestigationOverviewResponse } from "@/types/monitoring";
import { WorkspaceBreadcrumbs } from "@/components/common/workspace-breadcrumbs";

interface RackTelemetryViewportProps {
  rackId: string;
  overview: RackInvestigationOverviewResponse;
}

export default function RackTelemetryViewport({
  rackId,
  overview,
}: RackTelemetryViewportProps) {
  return (
    <div className="flex-1 flex flex-col p-4 space-y-5 overflow-y-auto min-w-0 transition-opacity duration-200 custom-scrollbar">
      {/* Top Breadcrumb Navigation */}
      <div className="flex justify-between items-center gap-2 shrink-0">
        <WorkspaceBreadcrumbs />
      </div>
      
      {/* Section A: Health Status & Culprit Triage Banner */}
      <RackHeaderTriage rackId={rackId} overview={overview} />

      {/* Section B: Aggregate Metrics & Trend Indicators */}
      <RackAggregateGrid overview={overview} />

      {/* Section C: Blast Radius Visualizer & Alerts Triage Suite */}
      <RackBlastAlertsTriage overview={overview} />

      {/* Section D: Problem-First Node Investigation Snapshot */}
      <RackProblemNodeGrid rackId={rackId} overview={overview} />
    </div>
  );
}
