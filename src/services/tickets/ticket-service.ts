import {
  requestServiceJson,
  serviceApiConfig,
} from "@/lib/http/service-api-client";
import type {
  AddTicketCommentInput,
  AssignTicketInput,
  AttachTicketEvidenceInput,
  CreateEvidenceUploadUrlInput,
  CreateTicketInput,
  ListTicketsParams,
  TechnicianOption,
  Ticket,
  TicketEvidence,
  TicketProps,
  UploadTarget,
} from "@/types/ticket";

function unwrapTicket(ticket: Ticket | TicketProps): TicketProps {
  return "props" in ticket && ticket.props ? ticket.props : (ticket as TicketProps);
}

function buildQueryString(params?: ListTicketsParams): string {
  const query = new URLSearchParams();

  if (params?.ticketCode) {
    query.set("ticketCode", params.ticketCode);
  }

  if (params?.status) {
    query.set("status", params.status);
  }

  const value = query.toString();
  return value ? `?${value}` : "";
}

export const ticketService = {
  listTickets: async (params?: ListTicketsParams): Promise<TicketProps[]> => {
    const tickets = await requestServiceJson<Array<Ticket | TicketProps>>(
      serviceApiConfig.incidentApiUrl,
      `/tickets${buildQueryString(params)}`,
    );

    return tickets.map(unwrapTicket);
  },

  getTicket: async (ticketId: string): Promise<TicketProps> =>
    unwrapTicket(
      await requestServiceJson<Ticket | TicketProps>(
        serviceApiConfig.incidentApiUrl,
        `/tickets/${encodeURIComponent(ticketId)}`,
      ),
    ),

  createTicket: async (payload: CreateTicketInput): Promise<TicketProps> =>
    unwrapTicket(
      await requestServiceJson<Ticket | TicketProps>(
        serviceApiConfig.incidentApiUrl,
        "/tickets",
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
      ),
    ),

  deleteTicket: async (ticketId: string): Promise<TicketProps> =>
    unwrapTicket(
      await requestServiceJson<Ticket | TicketProps>(
        serviceApiConfig.incidentApiUrl,
        `/tickets/${encodeURIComponent(ticketId)}`,
        {
          method: "DELETE",
        },
      ),
    ),

  assignTicket: async (
    ticketId: string,
    payload: AssignTicketInput,
  ): Promise<TicketProps> =>
    unwrapTicket(
      await requestServiceJson<Ticket | TicketProps>(
        serviceApiConfig.incidentApiUrl,
        `/tickets/${encodeURIComponent(ticketId)}/assignment`,
        {
          method: "PATCH",
          body: JSON.stringify(payload),
        },
      ),
    ),

  closeTicket: async (ticketId: string): Promise<TicketProps> =>
    unwrapTicket(
      await requestServiceJson<Ticket | TicketProps>(
        serviceApiConfig.incidentApiUrl,
        `/tickets/${encodeURIComponent(ticketId)}/close`,
        {
          method: "POST",
        },
      ),
    ),

  addComment: async (
    ticketId: string,
    payload: AddTicketCommentInput,
  ): Promise<TicketProps> =>
    unwrapTicket(
      await requestServiceJson<Ticket | TicketProps>(
        serviceApiConfig.incidentApiUrl,
        `/tickets/${encodeURIComponent(ticketId)}/comments`,
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
      ),
    ),

  listEvidence: (ticketId: string): Promise<TicketEvidence[]> =>
    requestServiceJson<TicketEvidence[]>(
      serviceApiConfig.incidentApiUrl,
      `/tickets/${encodeURIComponent(ticketId)}/evidence`,
    ),

  createEvidenceUploadUrl: (
    ticketId: string,
    payload: CreateEvidenceUploadUrlInput,
  ): Promise<UploadTarget> =>
    requestServiceJson<UploadTarget>(
      serviceApiConfig.incidentApiUrl,
      `/tickets/${encodeURIComponent(ticketId)}/evidence/upload-url`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    ),

  attachEvidence: (
    ticketId: string,
    payload: AttachTicketEvidenceInput,
  ): Promise<TicketEvidence> =>
    requestServiceJson<TicketEvidence>(
      serviceApiConfig.incidentApiUrl,
      `/tickets/${encodeURIComponent(ticketId)}/evidence`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    ),

  listTechnicians: (): Promise<TechnicianOption[]> =>
    requestServiceJson<TechnicianOption[]>(
      serviceApiConfig.identityApiUrl,
      "/technicians",
    ),
};
