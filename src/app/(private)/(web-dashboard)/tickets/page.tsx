import TicketManagementPage from "@/features/web-dashboard/tickets/ticket-management-page";
import { OperatorTicketRouteGuard } from "@/features/web-dashboard/tickets/ticket-route-guards";

export default function TicketsPage() {
  return (
    <OperatorTicketRouteGuard>
      <TicketManagementPage mode="all" />
    </OperatorTicketRouteGuard>
  );
}
