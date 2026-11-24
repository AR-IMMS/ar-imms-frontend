export type TicketStatus =
  | 'OPEN'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'WAITING_FOR_INFO'
  | 'RESOLVED'
  | 'CLOSED'
  | 'CANCELLED';

export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface TicketAssetReference {
  type: 'RACK' | 'NODE';
  assetId: string;
  code: string;
  displayName: string;
  rackId?: string;
  rackCode?: string;
}

export type EvidenceType =
  | 'IMAGE'
  | 'NOTE'
  | 'DOCUMENT'
  | 'LINK'
  | 'DIAGNOSTIC_SNAPSHOT'
  | 'FIELD_EVIDENCE';

export interface TicketEvidence {
  id: string;
  type: EvidenceType;
  attachedByUserId: string;
  storageKey?: string;
  url?: string;
  fileName?: string;
  mimeType?: string;
  sizeBytes?: number;
  note?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface TicketActivity {
  id: string;
  type: string;
  actorUserId: string;
  actorDisplayName?: string;
  actorRole?: string;
  message?: string;
  createdAt: string;
}

export interface Ticket {
  props?: TicketProps;
}

export interface TicketProps {
  id: string;
  ticketCode: string;
  title: string;
  description?: string;
  priority: TicketPriority;
  status: TicketStatus;
  incidentId?: string | null;
  ownerUserId?: string | null;
  assigneeUserId?: string | null;
  acknowledgedAt?: string | null;
  evidence?: TicketEvidence[];
  activities?: TicketActivity[];
  assetRef?: TicketAssetReference | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTicketInput {
  ticketCode: string;
  title: string;
  description?: string;
  priority: TicketPriority;
  incidentId?: string;
  assigneeUserId?: string;
}

export interface UploadTarget {
  method: 'PUT';
  uploadUrl: string;
  storageKey: string;
  objectUrl?: string;
  headers: Record<string, string>;
  expiresAt: string;
  fileName: string;
  mimeType: string;
  type: EvidenceType;
}
