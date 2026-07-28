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
  UploadTarget,
} from "@/types/ticket";

const INCIDENT_SERVICE_NAME = "incident";

export const ticketService = {
  listTickets: (params?: ListTicketsParams): Promise<Ticket[]> => {
    const queryString = params ? buildQueryString(params) : "";
    return httpGet<Ticket[]>(
      `${TICKET_ENDPOINTS.TICKETS}${queryString}`,
      { service: INCIDENT_SERVICE_NAME },
    );
  },

  getTicket: (ticketId: string): Promise<Ticket> =>
    httpGet<Ticket>(
      TICKET_ENDPOINTS.TICKET_BY_ID(ticketId),
      { service: INCIDENT_SERVICE_NAME },
    ),

  createTicket: (payload: CreateTicketInput): Promise<Ticket> =>
    httpPost<Ticket>(
      TICKET_ENDPOINTS.TICKETS,
      payload,
      { service: INCIDENT_SERVICE_NAME },
    ),

  deleteTicket: (ticketId: string): Promise<Ticket> =>
    httpDelete<Ticket>(
      TICKET_ENDPOINTS.TICKET_BY_ID(ticketId),
      { service: INCIDENT_SERVICE_NAME },
    ),

  assignTicket: (
    ticketId: string,
    payload: AssignTicketInput,
  ): Promise<Ticket> =>
    httpPatch<Ticket>(
      TICKET_ENDPOINTS.ASSIGNMENT(ticketId),
      payload,
      { service: INCIDENT_SERVICE_NAME },
    ),

  closeTicket: (ticketId: string): Promise<Ticket> =>
    httpPost<Ticket>(
      TICKET_ENDPOINTS.CLOSE(ticketId),
      undefined,
      { service: INCIDENT_SERVICE_NAME },
    ),

  addComment: (
    ticketId: string,
    payload: AddTicketCommentInput,
  ): Promise<Ticket> =>
    httpPost<Ticket>(
      TICKET_ENDPOINTS.COMMENTS(ticketId),
      payload,
      { service: INCIDENT_SERVICE_NAME },
    ),

  listEvidence: (ticketId: string): Promise<TicketEvidence[]> =>
    httpGet<TicketEvidence[]>(
      TICKET_ENDPOINTS.EVIDENCE(ticketId),
      { service: INCIDENT_SERVICE_NAME },
    ),

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
    httpPost<TicketEvidence>(
      TICKET_ENDPOINTS.EVIDENCE(ticketId),
      payload,
      { service: INCIDENT_SERVICE_NAME },
    ),
};
