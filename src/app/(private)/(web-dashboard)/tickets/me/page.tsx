import { Suspense } from 'react';
import TicketManagementPage from '@/features/web-dashboard/tickets/ticket-management-page';
import { AssignedTicketRouteGuard } from '@/features/web-dashboard/tickets/ticket-route-guards';

export default function MyTicketsPage() {
  return (
    <AssignedTicketRouteGuard>
      <Suspense
        fallback={
          <p role="status" className="p-8">
            Loading Tickets...
          </p>
        }
      >
        <TicketManagementPage mode="assigned-to-me" />
      </Suspense>
    </AssignedTicketRouteGuard>
  );
}
