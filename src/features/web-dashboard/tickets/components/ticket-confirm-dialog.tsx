'use client';
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
export default function TicketConfirmDialog({
  title,
  pending,
  onClose,
  children,
  wide = false,
  drawer = false,
}: {
  title: string;
  pending: boolean;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
  drawer?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        if (!pending) onClose();
      }}
      className={
        'ticket-readable fixed overflow-y-auto border border-border bg-surface-1 text-foreground shadow-2xl backdrop:bg-background/80 backdrop:backdrop-blur-sm ' +
        (drawer
          ? 'inset-y-0 left-auto right-0 m-0 h-dvh max-h-none w-full max-w-lg border-l-cyan/30'
          : 'inset-0 m-auto max-h-[92dvh] w-[calc(100%-2rem)] rounded-2xl ' +
            (wide ? 'max-w-6xl' : 'max-w-xl'))
      }
    >
      <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-cyan/15 bg-gradient-to-r from-surface-2 to-surface-1 px-5 py-4">
        <h2 id={titleId} className="title-display text-base">
          {title}
        </h2>
        <button
          type="button"
          aria-label="Close dialog"
          disabled={pending}
          onClick={onClose}
          className="rounded-lg p-1 text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-cyan disabled:opacity-50"
        >
          <X className="size-5" />
        </button>
      </header>
      {children}
    </dialog>
  );
}
