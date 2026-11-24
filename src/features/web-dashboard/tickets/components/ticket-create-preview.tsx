import TicketPriorityIcon from './ticket-priority-icon';
import type { TicketPriorityMetadata } from '@/services/tickets/ticket-service';
import { CheckCircle2, Circle, ClipboardList } from 'lucide-react';
import { badgeClass, statusTone, ticketPriority } from '../lib/ticket-ui';

export default function TicketCreatePreview({
  catalog,
  title,
  description,
  priority,
  owner,
  assignee,
  assets,
  ready,
}: {
  catalog: readonly TicketPriorityMetadata[];
  title: string;
  description: string;
  priority: number;
  owner: string;
  assignee: string;
  assets: string[];
  ready: boolean[];
}) {
  const steps = [
    'Title and description',
    'Priority selected',
    'Business Owner selected',
    'Assignee selected',
  ];
  const badge = priority > 0 ? ticketPriority(priority, catalog) : null;
  return (
    <aside
      aria-label="Ticket preview"
      className="min-w-0 border-t border-cyan/15 bg-gradient-to-b from-cyan/5 to-background/45 p-4 sm:p-6 md:border-l md:border-t-0"
    >
      <p className="label-mono text-[10px] text-cyan">Creation preview</p>
      <h3 className="title-display mt-1 text-base">Ticket Preview</h3>
      <div className="my-4 rounded-2xl border border-cyan/20 bg-background/40 p-4">
        <span className="mb-3 grid size-11 place-items-center rounded-xl border border-cyan/25 bg-cyan/10 text-cyan">
          <ClipboardList aria-hidden className="size-5" />
        </span>
        <p className="break-words text-lg font-semibold">
          {title || 'Untitled Ticket'}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Ticket number assigned after creation
        </p>
        {description && (
          <p className="mt-3 line-clamp-3 whitespace-pre-wrap break-words text-xs text-muted-foreground">
            {description}
          </p>
        )}
        <dl className="mt-4 grid gap-3 border-t border-border pt-4 text-sm">
          <div className="flex flex-wrap justify-between gap-2">
            <dt className="text-muted-foreground">Priority</dt>
            <dd>
              {badge ? (
                <span
                  className={
                    badgeClass +
                    ' inline-flex items-center gap-1.5 ' +
                    badge.badge
                  }
                >
                  <TicketPriorityIcon tone={badge.tone} />
                  {badge.label}
                </span>
              ) : (
                'Select a priority'
              )}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-2">
            <dt className="text-muted-foreground">Initial state</dt>
            <dd className={badgeClass + ' ' + statusTone.NEW}>NEW</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Business Owner</dt>
            <dd className="break-all text-cyan-ice">
              {owner || 'Not selected'}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Assignee</dt>
            <dd className="break-all text-cyan-ice">
              {assignee || 'Not selected'}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Related Assets</dt>
            <dd>
              {assets.length ? (
                <ul className="mt-1 grid gap-1">
                  {assets.map((asset, index) => (
                    <li className="break-all" key={index}>
                      {asset}
                    </li>
                  ))}
                </ul>
              ) : (
                'None selected'
              )}
            </dd>
          </div>
        </dl>
      </div>
      <p className="label-mono mb-2 text-[10px] text-muted-foreground">
        Dispatch readiness
      </p>
      <ul className="grid gap-2">
        {steps.map((step, index) => {
          const Icon = ready[index] ? CheckCircle2 : Circle;
          return (
            <li
              key={step}
              className="flex items-center gap-2 rounded-lg border border-border bg-background/25 p-2 text-xs"
            >
              <Icon
                className={
                  'size-4 ' +
                  (ready[index] ? 'text-neon-green' : 'text-muted-foreground')
                }
                aria-hidden
              />
              <span className="sr-only">
                {ready[index] ? 'Complete: ' : 'Required: '}
              </span>
              {step}
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
