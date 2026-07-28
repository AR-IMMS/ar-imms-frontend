export const STATUS_COLORS: Record<string, string> = {
  healthy: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  alerting: "text-critical bg-critical/10 border-critical/20 animate-pulse",
  unknown: "text-slate-400 bg-slate-500/10 border-slate-500/20",
};

export const SEVERITY_COLORS: Record<string, string> = {
  healthy: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  stale: "text-purple bg-purple/10 border-purple/20",
  warning: "text-amber bg-amber/10 border-amber/20",
  high: "text-critical bg-critical/10 border-critical/20 font-bold",
  critical: "text-critical bg-critical/20 border-critical/40 font-extrabold animate-pulse",
};