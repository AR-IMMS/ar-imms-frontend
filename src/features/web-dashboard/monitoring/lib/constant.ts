export const STATUS_COLOR_TEXT: Record<string, string> = {
  healthy: "text-emerald-400",
  warning: "text-amber",
  critical: "text-critical",
  unknown: "text-slate-400",
};

export const COLLECTOR_STATUS_COLORS: Record<string, string> = {
  online: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  offline: "text-critical bg-critical/10 border-critical/20 animate-pulse",
  unknown: "text-slate-400 bg-slate-500/10 border-slate-500/20",
};

export const COLLECTOR_STATUS_COLOR_TEXT: Record<string, string> = {
  online: "text-emerald-400",
  offline: "text-critical",
  unknown: "text-slate-400",
};

export const SEVERITY_COLOR_TEXT: Record<string, string> = {
  healthy: "text-emerald-400",
  stale: "text-purple",
  warning: "text-amber",
  high: "text-critical",
  critical: "text-critical font-extrabold animate-pulse",
};

export const STATUS_EXPLANATIONS: Record<string, string> = {
  unknown: "The data is stale (freshnessSec < 0 or all metrics are stale with no warning/critical alerts present)",
  warning: "At least one metric alert is active (Warning Metric Count > 0)",
  critical: "At least one metric alert is active (Critical Metric Count > 0)",
  healthy: "All telemetry metrics are reporting within safe, normal operational limits"
};