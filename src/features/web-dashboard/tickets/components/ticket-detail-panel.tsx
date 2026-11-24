'use client';
import { useState } from 'react';
import { useTicketPriorities } from '@/hooks/tickets/use-ticket-priorities';
import { useRouter } from 'next/navigation';
import TicketPriorityIcon from './ticket-priority-icon';
import TicketEvidenceGallery from './ticket-evidence-gallery';
import {
  Activity,
  Boxes,
  Clock3,
  LockKeyhole,
  MessageSquareText,
  Pencil,
  RotateCcw,
  Ticket as TicketIcon,
  UserRound,
  UsersRound,
  Zap,
  Trash2,
  ArchiveRestore,
  Paperclip,
} from 'lucide-react';
import {
  useTicketArticlesQuery,
  useTicketLinksQuery,
  useTicketOwnerQuery,
} from '@/hooks/tickets/use-ticket-queries';
import { useTicketOperation } from '@/hooks/tickets/use-ticket-mutations';
import { useAuth } from '@/hooks/auth/use-auth';
import { ticketAccess } from '@/lib/auth/ticket-access';
import { nextProgress } from '@/services/tickets/ticket-contract';
import { ticketError } from '@/services/tickets/ticket-operation';
import { ticketStates, type Ticket, type TicketAction } from '@/types/ticket';
import TicketAssetCards from './ticket-asset-cards';
import TicketEditor, { actionLabels } from './ticket-editor';
import {
  badgeClass,
  panelClass,
  ticketPriority,
  formatDateTime,
  primaryButton,
  secondaryButton,
  statusText,
  statusTone,
} from '../lib/ticket-ui';

function PendingAction({
  action,
  id,
  onOpen,
}: {
  action: TicketAction;
  id: number;
  onOpen: () => void;
}) {
  const operation = useTicketOperation(action, id);
  if (!operation.pending) return null;
  return (
    <div
      role="status"
      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber/40 bg-amber/10 p-3 text-sm"
    >
      <span>
        {actionLabels[action]} is awaiting confirmation.
        {operation.pending.requestId
          ? ' Request ID: ' + operation.pending.requestId
          : ''}
      </span>
      <button className={secondaryButton} onClick={onOpen}>
        Review pending request
      </button>
    </div>
  );
}

const actionIcons = {
  create: TicketIcon,
  update: Pencil,
  responsibilities: UsersRound,
  progress: Activity,
  article: MessageSquareText,
  links: Boxes,
  close: LockKeyhole,
  reopen: RotateCcw,
  archive: Trash2,
  restore: ArchiveRestore,
  evidence: Paperclip,
};

export default function TicketDetailPanel({ ticket }: { ticket: Ticket }) {
  const { user } = useAuth();
  const router = useRouter();
  const priority = ticketPriority(
    ticket.priorityId,
    useTicketPriorities().data ?? []
  );
  const access = ticketAccess(user);
  const [editor, setEditor] = useState<TicketAction | null>(null);
  const owner = useTicketOwnerQuery(
    ticket,
    access.close || (access.reopen && !access.operator)
  );
  const links = useTicketLinksQuery(ticket.id, access.read);
  const articles = useTicketArticlesQuery(ticket.id, access.read);
  const notes = articles.data?.pages.flatMap((page) => page.items) ?? [];
  const canClose =
    access.close &&
    ticket.state === 'OPEN' &&
    owner.data === true &&
    !owner.isError &&
    !owner.isFetching;
  const canReopen =
    access.reopen &&
    (access.operator ||
      (owner.data === true && !owner.isError && !owner.isFetching));
  const actionButton = (action: TicketAction, primary = false) => {
    const Icon = actionIcons[action];
    return (
      <button
        className={
          action === 'archive'
            ? secondaryButton + ' border-critical/40 text-critical'
            : primary
              ? primaryButton
              : secondaryButton
        }
        onClick={() => setEditor(action)}
      >
        <Icon className="size-4" aria-hidden />
        {actionLabels[action]}
      </button>
    );
  };
  const recovery: TicketAction[] = [
    ...(access.manage
      ? (['update', 'responsibilities', 'archive'] as const)
      : []),
    ...(canReopen ? (['reopen'] as const) : []),
    ...(access.manage && access.assets ? (['links'] as const) : []),
    ...(access.work ? (['progress', 'article'] as const) : []),
    ...(access.close && owner.data === true && !owner.isError
      ? (['close'] as const)
      : []),
  ];
  return (
    <>
      <section
        className={
          panelClass +
          ' relative overflow-hidden bg-gradient-to-br from-cyan/10 via-surface-2/55 to-surface-1 p-4 sm:p-6'
        }
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan/55 to-transparent" />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-cyan/25 bg-cyan/10 text-cyan sm:size-12">
              <TicketIcon aria-hidden className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="label-mono text-xs text-cyan">#{ticket.number}</p>
              <h2 className="mt-1 break-words text-xl font-semibold sm:text-2xl">
                {ticket.title}
              </h2>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <span
              className={
                badgeClass + ' ' + statusTone[ticket.state ?? 'CLOSED']
              }
            >
              {statusText(ticket)}
            </span>
            <span
              className={badgeClass + ' items-center gap-1.5 ' + priority.badge}
            >
              <TicketPriorityIcon tone={priority.tone} />
              {priority.label}
            </span>
          </div>
        </div>
        <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
          {[
            ['Created', ticket.createdAt],
            ['Updated', ticket.updatedAt],
          ].map(([label, date]) => (
            <div
              key={label}
              className="flex items-center gap-3 rounded-xl border border-border bg-background/35 p-3"
            >
              <Clock3 className="size-4 text-cyan-ice" aria-hidden />
              <div>
                <dt className="label-mono text-[10px] text-muted-foreground">
                  {label}
                </dt>
                <dd>
                  <time dateTime={date}>{formatDateTime(date)}</time>
                </dd>
              </div>
            </div>
          ))}
        </dl>
      </section>
      {recovery.map((action) => (
        <PendingAction
          key={action}
          action={action}
          id={ticket.id}
          onOpen={() => setEditor(action)}
        />
      ))}
      {(access.manage ||
        (access.work && nextProgress(ticket.state)) ||
        canClose ||
        (canReopen && ticket.state === 'CLOSED')) && (
        <section className={panelClass + ' p-4 sm:p-5'}>
          <h2 className="title-display mb-3 flex items-center gap-2 text-sm">
            <Zap className="size-4 text-cyan" aria-hidden />
            Quick Actions
          </h2>
          <div className="flex flex-wrap gap-2">
            {access.work &&
              nextProgress(ticket.state) &&
              actionButton('progress', true)}
            {access.manage && actionButton('update')}
            {access.manage && actionButton('archive')}
            {access.manage && actionButton('responsibilities')}
            {access.manage &&
              access.assets &&
              links.isSuccess &&
              actionButton('links')}
            {canClose && actionButton('close')}
            {canReopen && ticket.state === 'CLOSED' && actionButton('reopen')}
          </div>
        </section>
      )}
      <div className="grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(21rem,0.62fr)]">
        <section
          className={panelClass + ' min-w-0 p-4 sm:p-5'}
          aria-labelledby="ticket-notes"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2
              id="ticket-notes"
              className="title-display flex items-center gap-2 text-sm"
            >
              <MessageSquareText className="size-4 text-cyan" aria-hidden />
              Article history
            </h2>
          </div>
          {access.work && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-cyan/20 bg-cyan/5 p-3">
              <p className="text-sm text-muted-foreground">
                Record a handoff or progress update.
              </p>
              {actionButton('article')}
            </div>
          )}
          {articles.isPending ? (
            <div role="status" className="mt-4 space-y-2">
              <span className="sr-only">Loading Articles</span>
              <div className="h-16 animate-pulse rounded-xl bg-background/50" />
              <div className="h-16 animate-pulse rounded-xl bg-background/50" />
            </div>
          ) : articles.isError ? (
            <p role="alert" className="mt-4 text-sm">
              {ticketError(articles.error)}{' '}
              <button
                className="underline"
                onClick={() => void articles.refetch()}
              >
                Retry
              </button>
            </p>
          ) : notes.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
              No Articles yet.
            </p>
          ) : (
            <ol className="mt-5 space-y-3 border-l border-cyan/25 pl-4">
              {notes.map((note) => (
                <li
                  key={note.id}
                  className="relative rounded-xl border border-border bg-background/35 p-3 before:absolute before:-left-[22px] before:top-4 before:size-2.5 before:rounded-full before:border before:border-cyan/50 before:bg-surface-1"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span className="font-medium text-cyan-ice">
                      {note.internal ? 'Internal ' + note.type : note.type}
                    </span>
                    <time dateTime={note.createdAt}>
                      {formatDateTime(note.createdAt)}
                    </time>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed">
                    {note.body ?? 'Text unavailable for this Article.'}
                  </p>
                </li>
              ))}
            </ol>
          )}
          {articles.hasNextPage && (
            <button
              className={'mt-4 ' + secondaryButton}
              disabled={articles.isFetching}
              onClick={() => void articles.fetchNextPage()}
            >
              Load more Articles
            </button>
          )}
        </section>
        <div className="min-w-0 space-y-5">
          <section
            className={panelClass + ' p-4 sm:p-5'}
            aria-labelledby="ticket-workflow"
          >
            <h2
              id="ticket-workflow"
              className="title-display flex items-center gap-2 text-sm"
            >
              <Activity className="size-4 text-cyan" aria-hidden />
              Workflow Control
            </h2>
            <ol
              aria-label="Ticket states"
              className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-2 2xl:grid-cols-4"
            >
              {ticketStates.map((state) => (
                <li
                  key={state}
                  aria-current={state === ticket.state ? 'step' : undefined}
                  className={
                    'rounded-lg border px-2 py-2 text-center font-mono text-xs ' +
                    (state === ticket.state
                      ? statusTone[state]
                      : 'border-border bg-background/30 text-muted-foreground')
                  }
                >
                  {state}
                </li>
              ))}
            </ol>
            <div className="mt-4 space-y-1 text-xs text-muted-foreground">
              <p>Progress: NEW → OPEN → PENDING → OPEN</p>
              <p>Closure: OPEN → CLOSED · Reopen: CLOSED → OPEN</p>
            </div>
            {!ticket.state && (
              <p className="mt-3 text-xs text-muted-foreground">
                Lifecycle actions require verified state IDs.
              </p>
            )}
            {access.close && ticket.state === 'OPEN' && owner.isError && (
              <p role="status" className="mt-3 text-xs text-muted-foreground">
                Unable to verify Business Owner.{' '}
                <button
                  className="text-cyan underline"
                  onClick={() => void owner.refetch()}
                >
                  Retry verification
                </button>
              </p>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              {access.work && nextProgress(ticket.state) && (
                <span className="text-xs text-cyan-ice">
                  Next progress step: {nextProgress(ticket.state)}
                </span>
              )}
            </div>
          </section>
          <section className={panelClass + ' p-4 sm:p-5'}>
            <h2 className="title-display flex items-center gap-2 text-sm">
              <UsersRound className="size-4 text-cyan" aria-hidden />
              Responsibilities
            </h2>
            <dl className="my-3 grid gap-2">
              {[
                [
                  'Business Owner',
                  owner.data === true && !owner.isError && !owner.isFetching
                    ? 'You are the Business Owner'
                    : 'Identity unavailable',
                ],
                ['Assignee', 'Identity unavailable'],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-center gap-3 rounded-xl border border-border bg-background/35 p-3"
                >
                  <UserRound
                    className="size-4 shrink-0 text-cyan-ice"
                    aria-hidden
                  />
                  <div className="min-w-0">
                    <dt className="label-mono text-[10px] text-muted-foreground">
                      {label}
                    </dt>
                    <dd className="break-words text-sm">{value}</dd>
                  </div>
                </div>
              ))}
            </dl>
          </section>
          <section className={panelClass + ' p-4 sm:p-5'}>
            <h2 className="title-display flex items-center gap-2 text-sm">
              <Boxes className="size-4 text-cyan" aria-hidden />
              Business links
            </h2>
            {links.isPending ? (
              <p role="status" className="mt-3 text-sm">
                Loading links...
              </p>
            ) : links.isError ? (
              <p role="alert" className="mt-3 text-sm">
                {ticketError(links.error)}{' '}
                <button
                  className="underline"
                  onClick={() => void links.refetch()}
                >
                  Retry
                </button>
              </p>
            ) : (
              <div className="my-3 space-y-3 text-sm">
                <TicketAssetCards ids={links.data.assetIds} />
                {links.data.incidentId && (
                  <p className="break-all">Incident: {links.data.incidentId}</p>
                )}
                {links.data.maintenanceIds.length > 0 && (
                  <p className="break-all">
                    Maintenance: {links.data.maintenanceIds.join(', ')}
                  </p>
                )}
                <details className="text-xs text-muted-foreground">
                  <summary className="cursor-pointer">Other link types</summary>
                  <p className="mt-2">
                    Incident and Maintenance linking are currently unavailable.
                  </p>
                </details>
              </div>
            )}
          </section>
        </div>
      </div>
      <TicketEvidenceGallery ticketId={ticket.id} writable={access.work} />
      {editor && (
        <TicketEditor
          key={editor}
          action={editor}
          ticket={ticket}
          links={links.data}
          onClose={() => setEditor(null)}
          onCompleted={
            editor === 'archive'
              ? () => router.replace('/tickets?view=archived')
              : undefined
          }
        />
      )}
    </>
  );
}
