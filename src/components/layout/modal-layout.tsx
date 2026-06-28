"use client";

import { ReactNode } from "react";
import { X } from "lucide-react";

interface ModalLayoutProps {
  onClose: () => void;
  eyebrow: string;
  title: string;
  children: ReactNode;
  isPending?: boolean;
  maxWidth?: string; // defaults to "max-w-4xl"
}

export default function ModalLayout({
  onClose,
  eyebrow,
  title,
  children,
  isPending = false,
  maxWidth = "max-w-4xl",
}: ModalLayoutProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop glass blur */}
      <div
        className="absolute inset-0 bg-[#0b1020]/75 backdrop-blur-md"
        onClick={isPending ? undefined : onClose}
      />

      {/* Elevated Modal Panel */}
      <div
        className={`glass relative flex h-auto max-h-[90vh] w-full ${maxWidth} flex-col overflow-hidden rounded-2xl border border-[#25304A] bg-[#111827] shadow-[0_20px_50px_rgba(0,0,0,0.5)]`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#25304A] px-6 py-4">
          <div>
            <div className="label-mono text-[10px] text-cyan-ice tracking-wider uppercase">
              {eyebrow}
            </div>
            <div className="title-display mt-1 text-base text-foreground">
              {title}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="rounded-lg p-1 text-muted-foreground hover:bg-white/5 hover:text-foreground transition disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Modal Body / Content */}
        {children}
      </div>
    </div>
  );
}
