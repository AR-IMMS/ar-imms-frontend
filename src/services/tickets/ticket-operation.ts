import { z } from 'zod';
import { ticketInputs, type TicketAction } from '../../types/ticket';

export const operationRecord = z.object({
  key: z.uuid(),
  payload: z.unknown(),
  requestId: z.string().optional(),
});
export type OperationRecord = z.infer<typeof operationRecord>;
export function newOperation(
  action: TicketAction,
  input: unknown
): OperationRecord {
  return {
    key: crypto.randomUUID(),
    payload: ticketInputs[action].parse(input),
  };
}
export function errorInfo(error: unknown) {
  if (!error || typeof error !== 'object') return {};
  const value = z
    .object({
      status: z.number().optional(),
      code: z.string().optional(),
      requestId: z.string().optional(),
      message: z.string().optional(),
    })
    .safeParse(error);
  return value.success ? value.data : {};
}
export function isDefinitiveFailure(error: unknown) {
  const { status, code } = errorInfo(error);
  return (
    status === 400 ||
    status === 401 ||
    (status === 409 && code === 'TICKET_CONFLICT')
  );
}
export function ticketError(error: unknown) {
  const { status, code, message, requestId } = errorInfo(error);
  const detail =
    code === 'TICKET_UNRESOLVED'
      ? 'Core has not confirmed the outcome. Retry the same operation or contact support.'
      : status === 401
        ? 'Your session expired. Sign in again.'
        : status === 403
          ? 'You do not have permission for this action.'
          : status === 404
            ? 'Ticket not found or no longer accessible.'
            : status === 409
              ? 'The Ticket or operation changed. Refresh the Ticket before continuing.'
              : status === 503
                ? 'Core or a required dependency is unavailable.'
                : status === 400
                  ? (message ?? 'Check the submitted fields.')
                  : status === 0
                    ? 'The connection was interrupted.'
                    : (message ?? 'The response could not be verified.');
  return requestId ? detail + ' Request ID: ' + requestId : detail;
}
