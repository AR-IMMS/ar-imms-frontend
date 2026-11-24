'use client';
import { useEffect, useRef, useState } from 'react';
import { useInfiniteQuery, useMutation, useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import {
  Download,
  FileText,
  ImageIcon,
  Paperclip,
  UploadCloud,
} from 'lucide-react';
import { useAuth } from '@/hooks/auth/use-auth';
import { useTicketOperation } from '@/hooks/tickets/use-ticket-mutations';
import {
  ticketService,
  type TicketEvidenceItem,
} from '@/services/tickets/ticket-service';
import { ticketError } from '@/services/tickets/ticket-operation';
import TicketConfirmDialog from './ticket-confirm-dialog';
import {
  fieldClass,
  formatDateTime,
  panelClass,
  primaryButton,
  secondaryButton,
} from '../lib/ticket-ui';

const allowed = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'];
const maxBytes = 8 * 1024 * 1024;
function useObjectUrl(blob: Blob | undefined) {
  const [value, setValue] = useState<{ blob: Blob; url: string } | null>(null);
  useEffect(() => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const timer = window.setTimeout(() => setValue({ blob, url }), 0);
    return () => {
      window.clearTimeout(timer);
      URL.revokeObjectURL(url);
    };
  }, [blob]);
  return value?.blob === blob ? value?.url : undefined;
}
function EvidenceImage({
  ticketId,
  item,
  expanded = false,
}: {
  ticketId: number;
  item: TicketEvidenceItem;
  expanded?: boolean;
}) {
  const { user } = useAuth();
  const [visible, setVisible] = useState(expanded);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (expanded || !ref.current) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setVisible(true);
        observer.disconnect();
      }
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [expanded]);
  const image = useQuery({
    queryKey: ['tickets', 'evidence-image', user?.id, ticketId, item.id],
    queryFn: () => ticketService.readEvidence(ticketId, item.id, 'inline'),
    enabled: visible,
    staleTime: 30_000,
    gcTime: 60_000,
    retry: false,
  });
  const url = useObjectUrl(image.data);
  return (
    <div
      ref={ref}
      className={
        'relative min-w-0 overflow-hidden rounded-xl bg-background/50 ' +
        (expanded ? 'h-[65vh]' : 'h-28')
      }
    >
      {url && !image.isError ? (
        <Image
          alt={item.file_name}
          src={url}
          fill
          sizes={expanded ? '640px' : '256px'}
          unoptimized
          className={expanded ? 'object-contain' : 'object-cover'}
        />
      ) : (
        <span className="grid h-full place-items-center p-3 text-xs text-muted-foreground">
          {image.isError ? 'Preview unavailable' : 'Loading preview...'}
        </span>
      )}
    </div>
  );
}

function EvidenceCard({
  ticketId,
  item,
  onPreview,
}: {
  ticketId: number;
  item: TicketEvidenceItem;
  onPreview: () => void;
}) {
  const download = useMutation({
    retry: false,
    mutationFn: async () => {
      const blob = await ticketService.readEvidence(
        ticketId,
        item.id,
        'attachment'
      );
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = item.file_name;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    },
  });
  const image = item.mime_type.startsWith('image/');
  return (
    <li className="min-w-0 space-y-2 rounded-xl border border-border bg-background/35 p-3">
      {image ? (
        <EvidenceImage ticketId={ticketId} item={item} />
      ) : (
        <div className="grid h-28 place-items-center rounded-xl border border-amber/20 bg-amber/5 text-amber">
          <FileText className="size-8" aria-hidden />
          <span className="sr-only">PDF document</span>
        </div>
      )}
      <p className="break-words text-sm font-semibold">{item.file_name}</p>
      <p className="text-xs text-muted-foreground">
        {Math.ceil(item.file_size / 1024)} KB ·{' '}
        {formatDateTime(item.created_at)}
      </p>
      <div className="flex flex-wrap gap-2">
        {image && (
          <button type="button" className={secondaryButton} onClick={onPreview}>
            <ImageIcon className="size-4" aria-hidden />
            Preview
          </button>
        )}
        <button
          type="button"
          className={secondaryButton}
          disabled={download.isPending}
          onClick={() => download.mutate()}
        >
          <Download className="size-4" aria-hidden />
          {download.isPending ? 'Downloading...' : 'Download'}
        </button>
      </div>
      {download.isError && (
        <p role="alert" className="text-xs text-critical">
          {ticketError(download.error)}
        </p>
      )}
    </li>
  );
}

export default function TicketEvidenceGallery({
  ticketId,
  writable,
}: {
  ticketId: number;
  writable: boolean;
}) {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<TicketEvidenceItem | null>(null);
  const uploadGrant = useRef<{
    file: File;
    grant: string;
    expires_at: string;
  } | null>(null);
  const operation = useTicketOperation('evidence', ticketId);
  const query = useInfiniteQuery({
    queryKey: ['tickets', 'evidence', user?.id, ticketId],
    queryFn: ({ pageParam }) => ticketService.evidence(ticketId, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (page) => page.next_cursor ?? undefined,
    retry: false,
  });
  const enabled = query.data?.pages[0]?.upload_available === true && writable;
  const items = query.data?.pages.flatMap((page) => page.items) ?? [];
  function select(next: File | undefined) {
    if (!next) return;
    setFeedback('');
    if (
      !allowed.includes(next.type) ||
      next.size <= 0 ||
      next.size > maxBytes
    ) {
      setError('Choose a PNG, JPEG, WebP or PDF file up to 8 MB.');
      return;
    }
    setError('');
    setProgress(0);
    setFile(next);
  }
  function done() {
    setFile(null);
    uploadGrant.current = null;
    setFeedback('Evidence saved.');
  }
  const send = useMutation({
    retry: false,
    mutationFn: async () => {
      if (!file) throw new Error('Choose a file first.');
      if (
        !uploadGrant.current ||
        uploadGrant.current.file !== file ||
        Date.parse(uploadGrant.current.expires_at) <= Date.now()
      ) {
        uploadGrant.current = {
          file,
          ...(await ticketService.prepareEvidence(ticketId, file, file.type)),
        };
      }
      const grant = uploadGrant.current.grant;
      await ticketService.writeEvidence(ticketId, grant, file, setProgress);
      setProgress(1);
      await operation.submit({ grant });
    },
    onSuccess: done,
  });
  const busy = send.isPending || operation.isPending;
  return (
    <section
      className={panelClass + ' space-y-4 p-4 sm:p-5'}
      aria-label="Evidence"
    >
      <div className="flex items-center gap-2">
        <Paperclip className="size-4 text-cyan" aria-hidden />
        <h2 className="title-display text-sm">Evidence</h2>
      </div>
      {query.isPending ? (
        <p role="status" className="text-sm text-muted-foreground">
          Loading Evidence...
        </p>
      ) : query.isError ? (
        <p role="alert" className="text-sm">
          {ticketError(query.error)}{' '}
          <button className="underline" onClick={() => void query.refetch()}>
            Retry
          </button>
        </p>
      ) : items.length ? (
        <ul className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
          {items.map((item) => (
            <EvidenceCard
              key={item.id}
              ticketId={ticketId}
              item={item}
              onPreview={() => setPreview(item)}
            />
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No Evidence yet.</p>
      )}
      {query.hasNextPage && (
        <button
          className={secondaryButton}
          disabled={query.isFetching}
          onClick={() => void query.fetchNextPage()}
        >
          Load more Evidence
        </button>
      )}
      {writable && !enabled && query.isSuccess && (
        <p className="text-sm text-muted-foreground">
          Evidence uploads require a configured private store.
        </p>
      )}
      {enabled && (
        <div
          className="space-y-3 rounded-xl border border-dashed border-cyan/35 bg-cyan/5 p-4"
          onDragOver={(event) => {
            event.preventDefault();
          }}
          onDrop={(event) => {
            event.preventDefault();
            if (!busy && !operation.pending)
              select(event.dataTransfer.files[0]);
          }}
        >
          <div className="flex items-center gap-2 text-sm font-semibold">
            <UploadCloud className="size-4 text-cyan" aria-hidden />
            Drop Evidence here or choose a file
          </div>
          <label className="block">
            <span className="sr-only">Choose Evidence file</span>
            <input
              className={fieldClass}
              type="file"
              accept={allowed.join(',')}
              disabled={busy || Boolean(operation.pending)}
              onChange={(event) => {
                select(event.target.files?.[0]);
                event.target.value = '';
              }}
            />
          </label>
          <p className="text-xs text-muted-foreground">
            PNG, JPEG, WebP or PDF, up to 8 MB.
          </p>
          {busy && (
            <progress
              className="w-full accent-cyan"
              max={1}
              value={progress}
              aria-label="Evidence upload progress"
            />
          )}
          {operation.pending ? (
            <>
              <p role="status" className="text-sm text-amber">
                The Evidence outcome is unresolved. Retry the saved
                finalization.
              </p>
              <button
                className={primaryButton}
                disabled={busy}
                onClick={() =>
                  void operation
                    .retryPending()
                    .then(done)
                    .catch(() => {})
                }
              >
                Retry same Evidence request
              </button>
            </>
          ) : (
            <button
              className={primaryButton}
              disabled={!file || busy}
              onClick={() => {
                setError('');
                send.mutate();
              }}
            >
              {busy ? 'Uploading Evidence...' : 'Upload Evidence'}
            </button>
          )}
          {feedback && (
            <p role="status" className="text-sm text-neon-green">
              {feedback}
            </p>
          )}
          {(error || operation.error || send.error) && (
            <p role="alert" className="text-sm text-critical">
              {error || ticketError(operation.error ?? send.error)}
            </p>
          )}
        </div>
      )}
      {preview && (
        <TicketConfirmDialog
          title={preview.file_name}
          pending={false}
          onClose={() => setPreview(null)}
          wide
        >
          <div className="p-4">
            <EvidenceImage ticketId={ticketId} item={preview} expanded />
          </div>
        </TicketConfirmDialog>
      )}
    </section>
  );
}
