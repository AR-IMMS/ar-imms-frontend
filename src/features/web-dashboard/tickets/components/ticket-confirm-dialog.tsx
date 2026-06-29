"use client";

import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Trash2, X } from "lucide-react";

type ConfirmTone = "cyan" | "green" | "red" | "amber";

type TicketConfirmDialogProps = {
  open: boolean;
  eyebrow: string;
  title: string;
  message: string;
  confirmLabel: string;
  tone?: ConfirmTone;
  icon?: ReactNode;
  detail?: ReactNode;
  isPending?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function TicketConfirmDialog({
  open,
  eyebrow,
  title,
  message,
  confirmLabel,
  tone = "cyan",
  icon,
  detail,
  isPending = false,
  onCancel,
  onConfirm,
}: TicketConfirmDialogProps) {
  if (!open) {
    return null;
  }

  const toneClass = toneClasses[tone];

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-background/75 p-4 backdrop-blur-md">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-surface-1 shadow-[0_24px_80px_rgba(0,0,0,0.6)]">
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
          <div className="flex min-w-0 gap-4">
            <div
              className={`grid size-11 shrink-0 place-items-center rounded-xl border ${toneClass.icon}`}
            >
              {icon ?? defaultIcon(tone)}
            </div>
            <div className="min-w-0">
              <div className="label-mono text-[10px] text-cyan-ice">
                {eyebrow}
              </div>
              <h2 className="title-display mt-1 text-base text-foreground">
                {title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {message}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="rounded-lg p-1 text-muted-foreground transition hover:bg-white/5 hover:text-foreground disabled:opacity-50"
            aria-label="Close confirmation"
          >
            <X className="size-5" />
          </button>
        </div>

        {detail ? <div className="px-6 py-4">{detail}</div> : null}

        <div className="flex justify-end gap-3 border-t border-border bg-background/20 px-6 py-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="label-mono h-9 rounded-md border border-border bg-transparent px-4 text-[10px] text-muted-foreground transition hover:bg-white/5 hover:text-foreground disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className={`label-mono h-9 rounded-md px-4 text-[10px] font-semibold transition disabled:opacity-50 ${toneClass.button}`}
          >
            {isPending ? "Processing..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function defaultIcon(tone: ConfirmTone) {
  if (tone === "red") {
    return <Trash2 className="size-4 text-critical" />;
  }

  if (tone === "amber") {
    return <AlertTriangle className="size-4 text-amber" />;
  }

  return <CheckCircle2 className="size-4 text-cyan" />;
}

const toneClasses: Record<
  ConfirmTone,
  {
    icon: string;
    button: string;
  }
> = {
  cyan: {
    icon: "border-cyan/35 bg-cyan/10",
    button:
      "bg-cyan text-primary-foreground hover:shadow-[0_0_20px_rgba(0,209,255,0.35)]",
  },
  green: {
    icon: "border-neon-green/35 bg-neon-green/10",
    button:
      "bg-neon-green text-background hover:shadow-[0_0_20px_rgba(0,255,156,0.25)]",
  },
  red: {
    icon: "border-critical/35 bg-critical/10",
    button:
      "bg-critical text-white hover:shadow-[0_0_20px_rgba(255,77,109,0.28)]",
  },
  amber: {
    icon: "border-amber/35 bg-amber/10",
    button:
      "bg-amber text-background hover:shadow-[0_0_20px_rgba(255,200,87,0.24)]",
  },
};
