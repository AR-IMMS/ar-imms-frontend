import { use } from "react";
import TicketInvestigationPage from "@/features/web-dashboard/tickets/detail/ticket-investigation-page";
import { AssignedTicketRouteGuard } from "@/features/web-dashboard/tickets/ticket-route-guards";

type TicketDetailRouteProps = {
  params: Promise<{
    ticketId: string;
  }>;
};

export default function TicketDetailRoute({ params }: TicketDetailRouteProps) {
  const { ticketId } = use(params);

  return (
    <AssignedTicketRouteGuard>
      <TicketInvestigationPage ticketId={ticketId} />
    </AssignedTicketRouteGuard>
  );
}
