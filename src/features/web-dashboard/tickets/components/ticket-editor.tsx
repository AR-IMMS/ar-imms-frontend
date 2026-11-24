'use client';
import { useId, useState, type FormEvent } from 'react';
import { useTicketPriorities } from '@/hooks/tickets/use-ticket-priorities';
import { toast } from 'sonner';
import { useTicketOperation } from '@/hooks/tickets/use-ticket-mutations';
import {
  ticketService,
  type TicketPerson,
} from '@/services/tickets/ticket-service';
import { ticketError } from '@/services/tickets/ticket-operation';
import {
  ticketInputs,
  type Ticket,
  type TicketAction,
  type TicketLinks,
} from '@/types/ticket';
import { nextProgress } from '@/services/tickets/ticket-contract';
import TicketConfirmDialog from './ticket-confirm-dialog';
import TicketPriorityIcon from './ticket-priority-icon';
import TicketAssetPicker from './ticket-asset-picker';
import TicketCreatePreview from './ticket-create-preview';
import TicketResponsibilityPicker, {
  personLabel,
} from './ticket-responsibility-picker';
import {
  fieldClass,
  primaryButton,
  secondaryButton,
  ticketPriority,
} from '../lib/ticket-ui';

export const actionLabels: Record<TicketAction, string> = {
  create: 'Create Ticket',
  update: 'Edit information',
  responsibilities: 'Change responsibilities',
  progress: 'Update progress',
  article: 'Add internal note',
  links: 'Edit Asset links',
  close: 'Close Ticket',
  reopen: 'Reopen Ticket',
  archive: 'Move to Trash',
  restore: 'Restore Ticket',
  evidence: 'Finalize Evidence',
};
type TicketEditorProps = {
  action: TicketAction;
  ticket?: Ticket;
  links?: TicketLinks;
  onClose: () => void;
  onCreated?: (_id: number) => void;
  onCompleted?: () => void;
};
type Errors = Record<string, string>;
const text = (data: FormData, key: string) => {
  const value = data.get(key);
  return typeof value === 'string' ? value.trim() : '';
};
const number = (data: FormData, key: string) => Number(text(data, key));

export default function TicketEditor({
  action,
  ticket,
  links,
  onClose,
  onCreated,
  onCompleted,
}: TicketEditorProps) {
  const priorityQuery = useTicketPriorities();
  const priorities = priorityQuery.data ?? [];
  const operation = useTicketOperation(action, ticket?.id);
  const [assets, setAssets] = useState(links?.assetIds ?? []);
  const [assetNames, setAssetNames] = useState<Record<string, string>>({});
  const [owner, setOwner] = useState<TicketPerson | null>(null);
  const [assignee, setAssignee] = useState<TicketPerson | null>(null);
  const [draft, setDraft] = useState({
    title: '',
    description: '',
    priority: 0,
  });
  const [errors, setErrors] = useState<Errors>({});
  const needsDirectory = action === 'create' || action === 'responsibilities';
  const directoryId = useId();
  const target = ticket ? nextProgress(ticket.state) : null;
  const fieldsByAction: Record<TicketAction, (_data: FormData) => unknown> = {
    create: (data) => ({
      title: text(data, 'title'),
      description: text(data, 'description'),
      priority_id: number(data, 'priority_id'),
      business_owner_user_id: owner?.id ?? '',
      assignee_user_id: assignee?.id ?? '',
      ...(assets.length ? { asset_ids: assets } : {}),
    }),
    update: (data) => ({
      title: text(data, 'title'),
      ...(number(data, 'priority_id') &&
      number(data, 'priority_id') !== ticket?.priorityId
        ? { priority_id: number(data, 'priority_id') }
        : {}),
    }),
    responsibilities: () => ({
      ...(owner ? { business_owner_user_id: owner.id } : {}),
      ...(assignee ? { assignee_user_id: assignee.id } : {}),
    }),
    progress: (data) => ({
      state: target,
      ...(target === 'PENDING'
        ? { pending_until: parseDeadline(text(data, 'pending_until')) }
        : {}),
    }),
    article: (data) => ({ body: text(data, 'body') }),
    links: () => ({ asset_ids: assets }),
    close: (data) => ({ outcome: text(data, 'outcome') }),
    reopen: (data) => ({ reason: text(data, 'reason') }),
    archive: (data) => ({ reason: text(data, 'reason') }),
    restore: (data) => ({ reason: text(data, 'reason') }),
    evidence: (data) => ({ grant: text(data, 'grant') }),
  };
  const success = (
    result: Awaited<ReturnType<typeof ticketService.mutate>>
  ) => {
    toast.success(
      action === 'create'
        ? 'Ticket created.'
        : action === 'article'
          ? 'Internal note added.'
          : 'Ticket updated.'
    );
    if (action === 'create' && 'number' in result) onCreated?.(result.id);
    onCompleted?.();
    onClose();
  };
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = ticketInputs[action].safeParse(
      fieldsByAction[action](new FormData(event.currentTarget))
    );
    if (!parsed.success) {
      setErrors(
        Object.fromEntries(
          parsed.error.issues.map((issue) => [
            String(issue.path[0] ?? '_'),
            issue.message,
          ])
        )
      );
      return;
    }
    setErrors({});
    try {
      success(await operation.submit(parsed.data));
    } catch (error) {
      if (
        error &&
        typeof error === 'object' &&
        'errors' in error &&
        Array.isArray(error.errors)
      ) {
        setErrors(
          Object.fromEntries(
            error.errors.flatMap((field) =>
              field &&
              typeof field.message === 'string' &&
              Array.isArray(field.field)
                ? [[String(field.field.at(-1)), field.message]]
                : []
            )
          )
        );
      }
    }
  }
  const field = (
    name: string,
    label: string,
    options: {
      required?: boolean;
      type?: string;
      long?: boolean;
      max?: number;
      value?: string | number;
      list?: string;
    } = {}
  ) => (
    <label className="grid gap-1.5 text-sm font-medium">
      <span>
        {label}
        {options.required && <span className="text-cyan"> *</span>}
      </span>
      {options.long ? (
        <textarea
          className={fieldClass}
          name={name}
          required={options.required}
          maxLength={options.max}
          rows={4}
          aria-invalid={Boolean(errors[name])}
          aria-describedby={errors[name] ? directoryId + name : undefined}
        />
      ) : (
        <input
          className={fieldClass}
          name={name}
          type={options.type ?? 'text'}
          defaultValue={options.value}
          required={options.required}
          list={options.list}
          maxLength={options.max}
          min={options.type === 'number' ? 1 : undefined}
          step={options.type === 'number' ? 1 : undefined}
          aria-invalid={Boolean(errors[name])}
          aria-describedby={errors[name] ? directoryId + name : undefined}
        />
      )}
      {errors[name] && (
        <span id={directoryId + name} className="text-xs text-critical">
          {errors[name]}
        </span>
      )}
    </label>
  );

  const saved = ticketInputs.create.safeParse(operation.pending?.payload);
  const preview = saved.success
    ? {
        title: saved.data.title,
        description: saved.data.description,
        priority: saved.data.priority_id,
      }
    : draft;
  const previewOwner =
    owner && (!saved.success || saved.data.business_owner_user_id === owner.id)
      ? personLabel(owner)
      : '';
  const previewAssignee =
    assignee && (!saved.success || saved.data.assignee_user_id === assignee.id)
      ? personLabel(assignee)
      : '';
  const priorityOptions =
    priorities.length &&
    ticket &&
    !priorities.some((option) => option.id === ticket.priorityId)
      ? [
          ...priorities,
          { id: ticket.priorityId, label: 'Current priority (unavailable)' },
        ]
      : priorities;
  return (
    <TicketConfirmDialog
      title={actionLabels[action]}
      pending={operation.isPending}
      onClose={onClose}
      wide={action === 'create'}
    >
      <form
        onSubmit={submit}
        noValidate
        onChange={(event) => {
          if (action === 'create') {
            const data = new FormData(event.currentTarget);
            setDraft({
              title: text(data, 'title'),
              description: text(data, 'description'),
              priority: number(data, 'priority_id'),
            });
          }
        }}
      >
        <div
          className={
            action === 'create'
              ? 'grid md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]'
              : ''
          }
        >
          <div className="min-w-0 grid gap-4 p-4 sm:p-6">
            {action === 'create' && (
              <p className="text-sm text-muted-foreground">
                Enter the work details and choose who owns and carries out the
                work.
              </p>
            )}
            {action === 'close' && (
              <p className="text-sm text-muted-foreground">
                Close Ticket #{ticket?.number} as its current Business Owner.
                Linked work keeps its own lifecycle.
              </p>
            )}
            {action === 'archive' && (
              <p className="rounded-lg border border-critical/35 bg-critical/10 p-3 text-sm">
                Move #{ticket?.number} {ticket?.title} out of the active
                workspace. History, Articles and Evidence are preserved.
              </p>
            )}
            {action === 'restore' && (
              <p className="text-sm">
                Return #{ticket?.number} {ticket?.title} to the ordinary Ticket
                workspace. Current authorization still applies.
              </p>
            )}
            {action === 'reopen' && (
              <p className="text-sm text-muted-foreground">
                Reopen Ticket #{ticket?.number} and preserve its existing
                history.
              </p>
            )}
            {operation.pending ? (
              <div
                role="status"
                className="rounded-lg border border-amber/40 bg-amber/10 p-3 text-sm"
              >
                An operation is awaiting confirmation. Retry with the saved
                request. Keep this tab open if you need to continue later.
              </div>
            ) : null}
            {operation.error && (
              <p
                role="alert"
                className="rounded-lg border border-critical/40 bg-critical/10 p-3 text-sm"
              >
                {ticketError(operation.error)}
              </p>
            )}
            {errors._ && (
              <p role="alert" className="text-sm text-critical">
                {errors._}
              </p>
            )}
            <fieldset
              disabled={operation.isPending || Boolean(operation.pending)}
              className="min-w-0 grid gap-5 disabled:opacity-60"
            >
              {(action === 'create' || action === 'update') && (
                <>
                  {field('title', 'Title', {
                    required: true,
                    value: ticket?.title,
                    max: 200,
                  })}
                  <div className="space-y-2">
                    {priorityOptions.length ? (
                      <fieldset className="grid grid-cols-2 gap-2">
                        <legend className="mb-2 text-sm font-medium">
                          Priority <span className="text-cyan">*</span>
                        </legend>
                        {priorityOptions.map((item) => (
                          <label
                            key={item.id}
                            className={
                              'flex min-w-0 cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition has-checked:ring-1 has-checked:ring-cyan ' +
                              ticketPriority(item.id, priorities).badge
                            }
                          >
                            <input
                              type="radio"
                              className="accent-cyan"
                              name="priority_id"
                              value={item.id}
                              defaultChecked={ticket?.priorityId === item.id}
                            />
                            <TicketPriorityIcon
                              tone={ticketPriority(item.id, priorities).tone}
                            />
                            <span className="break-words">{item.label}</span>
                          </label>
                        ))}
                      </fieldset>
                    ) : (
                      <>
                        <p
                          role="status"
                          className="text-xs text-muted-foreground"
                        >
                          {priorityQuery.isPending
                            ? 'Loading priorities...'
                            : 'Priority catalog unavailable.'}{' '}
                          {!priorityQuery.isPending && (
                            <button
                              type="button"
                              className="underline"
                              onClick={() => void priorityQuery.refetch()}
                            >
                              Retry
                            </button>
                          )}
                        </p>
                      </>
                    )}
                    {priorityOptions.length > 0 && errors.priority_id && (
                      <p role="alert" className="text-xs text-critical">
                        {errors.priority_id}
                      </p>
                    )}
                  </div>
                </>
              )}
              {action === 'create' &&
                field('description', 'Description', {
                  required: true,
                  long: true,
                  max: 4000,
                })}
              {needsDirectory && (
                <section className="min-w-0 space-y-3">
                  <p className="label-mono text-[10px] text-cyan-ice">
                    Responsibilities
                  </p>
                  {action === 'responsibilities' && (
                    <p className="text-xs text-muted-foreground">
                      Leave either field without a selection to keep its current
                      value.
                    </p>
                  )}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <TicketResponsibilityPicker
                      label="Business Owner"
                      required={action === 'create'}
                      value={owner}
                      onChange={setOwner}
                      error={errors.business_owner_user_id}
                    />
                    <TicketResponsibilityPicker
                      label="Assignee"
                      required={action === 'create'}
                      value={assignee}
                      onChange={setAssignee}
                      error={errors.assignee_user_id}
                    />
                  </div>
                </section>
              )}
              {(action === 'create' || action === 'links') && (
                <TicketAssetPicker
                  value={assets}
                  onChange={(ids, names) => {
                    setAssets(ids);
                    setAssetNames(names);
                  }}
                />
              )}
              {action === 'progress' && (
                <>
                  <p className="text-sm">
                    Move from {ticket?.state} to{' '}
                    {target ?? 'an available state'}.
                  </p>
                  {target === 'PENDING' &&
                    field('pending_until', 'Pending until (local time)', {
                      type: 'datetime-local',
                      required: true,
                    })}
                </>
              )}
              {action === 'article' &&
                field('body', 'Internal note', {
                  required: true,
                  long: true,
                  max: 4000,
                })}
              {action === 'close' &&
                field('outcome', 'Outcome', {
                  required: true,
                  long: true,
                  max: 500,
                })}
              {['reopen', 'archive', 'restore'].includes(action) &&
                field('reason', 'Reason', {
                  required: true,
                  long: true,
                  max: 500,
                })}
            </fieldset>
          </div>
          {action === 'create' && (
            <TicketCreatePreview
              catalog={priorities}
              title={preview.title}
              description={preview.description}
              priority={preview.priority}
              owner={previewOwner}
              assignee={previewAssignee}
              assets={(saved.success
                ? (saved.data.asset_ids ?? [])
                : assets
              ).map((id) => assetNames[id] ?? id)}
              ready={[
                Boolean(preview.title && preview.description),
                Number.isSafeInteger(preview.priority) && preview.priority > 0,
                Boolean(previewOwner || saved.success),
                Boolean(previewAssignee || saved.success),
              ]}
            />
          )}
        </div>
        <footer className="sticky bottom-0 flex flex-wrap justify-end gap-2 border-t border-cyan/15 bg-surface-1 px-5 py-4">
          <button
            className={secondaryButton}
            type="button"
            onClick={onClose}
            disabled={operation.isPending}
          >
            {operation.pending ? 'Back' : 'Cancel'}
          </button>
          {operation.pending ? (
            <button
              type="button"
              className={
                action === 'archive'
                  ? 'rounded-lg border border-critical/50 bg-critical/15 px-4 py-2 text-sm text-critical hover:bg-critical/25 disabled:opacity-50'
                  : primaryButton
              }
              disabled={operation.isPending}
              onClick={() =>
                void operation
                  .retryPending()
                  .then(success)
                  .catch(() => {})
              }
            >
              {operation.isPending
                ? 'Checking outcome...'
                : 'Retry same request'}
            </button>
          ) : (
            <button
              type="submit"
              className={primaryButton}
              disabled={
                operation.isPending ||
                (action === 'create' &&
                  (!owner ||
                    !assignee ||
                    !priorities.some(({ id }) => id === draft.priority)))
              }
            >
              {operation.isPending ? 'Submitting...' : actionLabels[action]}
            </button>
          )}
        </footer>
      </form>
    </TicketConfirmDialog>
  );
}

function parseDeadline(value: string) {
  const time = new Date(value).getTime();
  return Number.isFinite(time) && Math.floor(time / 60000) * 60000 > Date.now()
    ? new Date(time).toISOString()
    : undefined;
}
