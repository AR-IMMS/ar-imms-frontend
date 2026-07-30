import { httpGet, httpPost, httpPatch, httpDelete } from "@/lib/http/http-methods";
import { TICKET_ENDPOINTS } from "@/lib/react-query/api-endpoint";
import buildQueryString from "@/lib/utils/buildQueryString";
import type {
  AddTicketCommentInput,
  AssignTicketInput,
  AttachTicketEvidenceInput,
  CreateEvidenceUploadUrlInput,
  CreateTicketInput,
  ListTicketsParams,
  Ticket,
  TicketEvidence,
  TicketStatus,
  UploadTarget,
} from "@/types/ticket";

const INCIDENT_SERVICE_NAME = "incident";

type EntityWrapped<T> = {
  props?: T;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function unwrapEntity<T>(value: unknown): T {
  if (isRecord(value) && isRecord(value.props)) {
    return value.props as T;
  }

  return value as T;
}

function normalizeTicket(value: unknown): Ticket {
  const ticket = unwrapEntity<Ticket & EntityWrapped<Ticket>>(value);

  if (!ticket.id) {
    throw new Error("Ticket response is missing an id.");
  }

  return ticket;
}

function normalizeTickets(value: unknown): Ticket[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((ticket) => normalizeTicket(ticket));
}

function normalizeEvidence(value: unknown): TicketEvidence {
  return unwrapEntity<TicketEvidence>(value);
}

function normalizeEvidenceList(value: unknown): TicketEvidence[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((evidence) => normalizeEvidence(evidence));
}

export const ticketService = {
  listTickets: async (params?: ListTicketsParams): Promise<Ticket[]> => {
    const queryString = params ? buildQueryString(params) : "";
    const response = await httpGet<unknown>(
      `${TICKET_ENDPOINTS.TICKETS}${queryString}`,
      { service: INCIDENT_SERVICE_NAME },
    );
    return normalizeTickets(response);
  },

  listAssignedTickets: async (
    params?: ListTicketsParams,
  ): Promise<Ticket[]> => {
    const queryString = params ? buildQueryString(params) : "";
    const response = await httpGet<unknown>(
      `${TICKET_ENDPOINTS.MY_TICKETS}${queryString}`,
      { service: INCIDENT_SERVICE_NAME },
    );
    return normalizeTickets(response);
  },

  getTicket: async (ticketId: string): Promise<Ticket> => {
    const response = await httpGet<unknown>(
      TICKET_ENDPOINTS.TICKET_BY_ID(ticketId),
      { service: INCIDENT_SERVICE_NAME },
    );
    return normalizeTicket(response);
  },

  createTicket: async (payload: CreateTicketInput): Promise<Ticket> => {
    const response = await httpPost<unknown>(
      TICKET_ENDPOINTS.TICKETS,
      payload,
      { service: INCIDENT_SERVICE_NAME },
    );
    return normalizeTicket(response);
  },

  deleteTicket: async (ticketId: string): Promise<Ticket> => {
    const response = await httpDelete<unknown>(
      TICKET_ENDPOINTS.TICKET_BY_ID(ticketId),
      { service: INCIDENT_SERVICE_NAME },
    );
    return normalizeTicket(response);
  },

  assignTicket: (
    ticketId: string,
    payload: AssignTicketInput,
  ): Promise<Ticket> =>
    httpPatch<unknown>(
      TICKET_ENDPOINTS.ASSIGNMENT(ticketId),
      payload,
      { service: INCIDENT_SERVICE_NAME },
    ).then((response) => normalizeTicket(response)),

  updateStatus: (
    ticketId: string,
    status: TicketStatus,
  ): Promise<Ticket> =>
    httpPatch<unknown>(
      TICKET_ENDPOINTS.STATUS(ticketId),
      { status },
      { service: INCIDENT_SERVICE_NAME },
    ).then((response) => normalizeTicket(response)),

  closeTicket: async (ticketId: string): Promise<Ticket> => {
    const response = await httpPost<unknown>(
      TICKET_ENDPOINTS.CLOSE(ticketId),
      undefined,
      { service: INCIDENT_SERVICE_NAME },
    );
    return normalizeTicket(response);
  },

  addComment: (
    ticketId: string,
    payload: AddTicketCommentInput,
  ): Promise<Ticket> =>
    httpPost<unknown>(
      TICKET_ENDPOINTS.COMMENTS(ticketId),
      payload,
      { service: INCIDENT_SERVICE_NAME },
    ).then((response) => normalizeTicket(response)),

  listEvidence: async (ticketId: string): Promise<TicketEvidence[]> => {
    const response = await httpGet<unknown>(
      TICKET_ENDPOINTS.EVIDENCE(ticketId),
      { service: INCIDENT_SERVICE_NAME },
    );
    return normalizeEvidenceList(response);
  },

  createEvidenceUploadUrl: (
    ticketId: string,
    payload: CreateEvidenceUploadUrlInput,
  ): Promise<UploadTarget> =>
    httpPost<UploadTarget>(
      TICKET_ENDPOINTS.EVIDENCE_UPLOAD_URL(ticketId),
      payload,
      { service: INCIDENT_SERVICE_NAME },
    ),

  attachEvidence: (
    ticketId: string,
    payload: AttachTicketEvidenceInput,
  ): Promise<TicketEvidence> =>
    httpPost<unknown>(
      TICKET_ENDPOINTS.EVIDENCE(ticketId),
      payload,
      { service: INCIDENT_SERVICE_NAME },
    ).then((response) => normalizeEvidence(response)),
};
