"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type CopyableUserIdProps = {
  value: string;
  className?: string;
};

export default function CopyableUserId({
  value,
  className,
}: CopyableUserIdProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setCopied(false);
    }, 1200);

    return () => window.clearTimeout(timeout);
  }, [copied]);

  async function handleCopy(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();

    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className={cn("flex min-w-0 items-center gap-2", className)}>
      <span
        className="min-w-0 max-w-30 truncate font-mono text-xs tabular-nums text-cyan-ice light:font-bold"
        title={value}
      >
        {value}
      </span>
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex size-6 shrink-0 items-center justify-center rounded border border-border bg-surface-1 text-muted-foreground transition hover:border-cyan/30 hover:text-cyan-ice hover:light:text-primary hover:light:bg-primary/10"
        aria-label={`Copy ID ${value}`}
        title={copied ? "Copied" : "Copy ID"}
      >
        {copied ? (
          <Check className="size-3.5" />
        ) : (
          <Copy className="size-3.5" />
        )}
      </button>
    </div>
  );
}
