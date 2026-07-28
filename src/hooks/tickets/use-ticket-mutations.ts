import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryClient } from "@/lib/react-query/query-client";
import { queryKeys } from "@/lib/react-query/query-keys";
import { ticketService } from "@/services/tickets/ticket-service";
import type {
  AddTicketCommentInput,
  AssignTicketInput,
  AttachTicketEvidenceInput,
  CreateTicketInput,
  TicketProps,
} from "@/types/ticket";

function syncTicketCaches(ticket: TicketProps) {
  queryClient.setQueryData(queryKeys.tickets.detail(ticket.id), ticket);

  queryClient.setQueriesData(
    { queryKey: queryKeys.tickets.lists() },
    (cachedData: unknown) => {
      if (!Array.isArray(cachedData)) {
        return cachedData;
      }

      return cachedData.map((item: TicketProps) =>
        item.id === ticket.id ? ticket : item,
      );
    },
  );
}

function invalidateTicketCollections(ticketId?: string) {
  void queryClient.invalidateQueries({ queryKey: queryKeys.tickets.lists() });

  if (ticketId) {
    void queryClient.invalidateQueries({
      queryKey: queryKeys.tickets.detail(ticketId),
    });
    void queryClient.invalidateQueries({
      queryKey: queryKeys.tickets.evidence(ticketId),
    });
  }
}

export function useCreateTicketMutation() {
  return useMutation({
    mutationFn: (payload: CreateTicketInput) =>
      ticketService.createTicket(payload),
    onSuccess: (ticket) => {
      syncTicketCaches(ticket);
      invalidateTicketCollections(ticket.id);
      toast.success("Ticket created.");
    },
  });
}

export function useAssignTicketMutation() {
  return useMutation({
    mutationFn: ({
      ticketId,
      payload,
    }: {
      ticketId: string;
      payload: AssignTicketInput;
    }) => ticketService.assignTicket(ticketId, payload),
    onSuccess: (ticket) => {
      syncTicketCaches(ticket);
      invalidateTicketCollections(ticket.id);
      toast.success("Technician assignment updated.");
    },
  });
}

export function useDeleteTicketMutation() {
  return useMutation({
    mutationFn: (ticketId: string) => ticketService.deleteTicket(ticketId),
    onSuccess: (ticket) => {
      invalidateTicketCollections(ticket.id);
      toast.success("Ticket removed from active workflow.");
    },
  });
}

export function useCloseTicketMutation() {
  return useMutation({
    mutationFn: (ticketId: string) => ticketService.closeTicket(ticketId),
    onSuccess: (ticket) => {
      syncTicketCaches(ticket);
      invalidateTicketCollections(ticket.id);
      toast.success("Ticket closed.");
    },
  });
}

export function useAddTicketCommentMutation() {
  return useMutation({
    mutationFn: ({
      ticketId,
      payload,
    }: {
      ticketId: string;
      payload: AddTicketCommentInput;
    }) => ticketService.addComment(ticketId, payload),
    onSuccess: (ticket) => {
      syncTicketCaches(ticket);
      invalidateTicketCollections(ticket.id);
      toast.success("Comment added.");
    },
  });
}

export function useAttachTicketEvidenceMutation() {
  return useMutation({
    mutationFn: async ({
      ticketId,
      file,
      note,
    }: {
      ticketId: string;
      file: File;
      note?: string;
    }) => {
      const upload = await ticketService.createEvidenceUploadUrl(ticketId, {
        type: "IMAGE",
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
      });

      const uploadResponse = await fetch(upload.uploadUrl, {
        method: upload.method,
        headers: upload.headers,
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error(`Evidence upload failed with ${uploadResponse.status}.`);
      }

      const payload: AttachTicketEvidenceInput = {
        type: upload.type,
        storageKey: upload.storageKey,
        url: upload.objectUrl,
        fileName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        note,
      };

      return ticketService.attachEvidence(ticketId, payload);
    },
    onSuccess: (_evidence, variables) => {
      invalidateTicketCollections(variables.ticketId);
      toast.success("Evidence attached.");
    },
  });
}
