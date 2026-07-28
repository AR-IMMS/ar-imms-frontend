import { Cpu } from "lucide-react";

export const metadata = {
  title: "Telemetry Monitoring - AR-IMMS Command Center",
  description: "Real-time infrastructure health, telemetry thresholds, and container workloads monitoring control center",
};

export default function FleetMonitoringPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center font-mono text-xs text-muted-foreground/60 gap-3">
      <div className="size-12 rounded-full border border-dashed border-border/40 flex items-center justify-center bg-cyan/5">
        <Cpu className="size-6 text-slate-500 animate-pulse" />
      </div>
      <span>
        SELECT A PHYSICAL NODE FROM THE HIERARCHY TO DEPLOY TELEMETRY VIEWPORT
      </span>
    </div>
  );
}
