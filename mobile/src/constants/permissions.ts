import type { PermissionCode } from '../types/auth';

export const PERMISSIONS = {
  INCIDENTS_READ: 'incidents.read',
  INCIDENTS_CREATE: 'incidents.create',
  TICKETS_READ: 'tickets.read',
  TICKETS_CREATE: 'tickets.create',
  TICKETS_ASSIGN: 'tickets.assign',
  TICKETS_STATUS_UPDATE: 'tickets.status.update',
  TICKETS_COMMENT: 'tickets.comment',
  TICKETS_EVIDENCE_ATTACH: 'tickets.evidence.attach',
  TICKETS_ACKNOWLEDGE: 'tickets.acknowledge',
  TICKETS_WORK_START: 'tickets.work.start',
  TICKETS_RESOLVE: 'tickets.resolve',
  TICKETS_CLOSE: 'tickets.close',
  TICKETS_CANCEL: 'tickets.cancel',
} as const satisfies Record<string, PermissionCode>;
