import { NodeAssignmentState, NodeLifecycleState, RackLifecycleState } from "@/types/assets";

export const CAPACITY_COLOR: Record<"AVAILABLE" | "EXPANDING" | "FULL", string> = {
  AVAILABLE: "text-neon-green border-neon-green/30 bg-neon-green/5",
  EXPANDING: "text-amber border-amber/30 bg-amber/5",
  FULL: "text-critical border-critical/30 bg-critical/5",
};

export const LIFECYCLE_COLOR: Record<NodeLifecycleState | RackLifecycleState, string> = {
  CREATED: "text-zinc-400 border-zinc-500/30 bg-zinc-500/5",
  DISCOVERED: "text-purple-400 border-purple-500/30 bg-purple-500/5",
  READY: "text-cyan-400 border-cyan-500/30 bg-cyan-500/5",
  ACTIVE: "text-neon-green border-neon-green/30 bg-neon-green/5",
  DRAINING: "text-amber border-amber/30 bg-amber/5",
  RETIRED: "text-critical border-critical/30 bg-critical/5",
};

export const LIFECYCLE_COLOR_DOT: Record<NodeLifecycleState | RackLifecycleState, string> = {
  CREATED: "bg-zinc-400 shadow-[0_0_8px_rgba(156,163,175,0.6)]",
  DISCOVERED: "bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.6)]",
  READY: "bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.6)]",
  ACTIVE: "bg-neon-green shadow-[0_0_8px_rgba(0,255,156,0.6)]",
  DRAINING: "bg-amber shadow-[0_0_8px_rgba(255,200,87,0.6)] animate-pulse-dot",
  RETIRED: "bg-critical shadow-[0_0_8px_rgba(255,77,109,0.7)] animate-pulse-dot",
};

export const LIFECYCLE_COLOR_BORDER: Record<NodeLifecycleState | RackLifecycleState, string> = {
  CREATED: "border-zinc-400/40",
  DISCOVERED: "border-purple-400/40",
  READY: "border-cyan-400/40",
  ACTIVE: "border-neon-green/40",
  DRAINING: "border-amber/40",
  RETIRED: "border-critical/60",
};

export const LIFECYCLE_COLOR_TEXT: Record<NodeLifecycleState | RackLifecycleState, string> = {
  CREATED: "text-zinc-400",
  DISCOVERED: "text-purple-400",
  READY: "text-cyan-400",
  ACTIVE: "text-neon-green",
  DRAINING: "text-amber",
  RETIRED: "text-critical",
};

export const ASSIGNMENT_COLOR: Record<NodeAssignmentState, string> = {
  UNASSIGNED: "text-amber border-amber/30 bg-amber/5",
  ASSIGNED: "text-neon-green border-neon-green/30 bg-neon-green/5",
  MOVED: "text-cyan border-cyan/30 bg-cyan/5",
};

export const ASSIGNMENT_COLOR_TEXT: Record<NodeAssignmentState, string> = {
  UNASSIGNED: "text-critical",
  ASSIGNED: "text-neon-green",
  MOVED: "text-amber",
};   