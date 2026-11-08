import { Suspense } from 'react';
import TicketManagementPage from '@/features/web-dashboard/tickets/ticket-management-page';
import { OperatorTicketRouteGuard } from '@/features/web-dashboard/tickets/ticket-route-guards';

export default function TicketsPage() {
  return (
    <OperatorTicketRouteGuard>
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-full text-slate-500 font-mono text-xs uppercase animate-pulse">
            Loading ticket workflow...
          </div>
        }
      >
        <TicketManagementPage mode="all" />
      </Suspense>
    </OperatorTicketRouteGuard>
  );
}
