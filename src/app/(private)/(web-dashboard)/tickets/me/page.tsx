import TicketManagementPage from "@/features/web-dashboard/tickets/ticket-management-page";
import { AssignedTicketRouteGuard } from "@/features/web-dashboard/tickets/ticket-route-guards";

export default function MyTicketsPage() {
  return (
    <AssignedTicketRouteGuard>
      <TicketManagementPage mode="assigned-to-me" />
    </AssignedTicketRouteGuard>
  );
}
