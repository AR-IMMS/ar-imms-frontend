'use client';
import { useQuery } from '@tanstack/react-query';
import { Box, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/auth/use-auth';
import { ticketAccess } from '@/lib/auth/ticket-access';
import { ticketService } from '@/services/tickets/ticket-service';

function AssetCard({ id }: { id: string }) {
  const { user } = useAuth();
  const asset = useQuery({
    queryKey: ['tickets', 'asset', user?.id, id],
    queryFn: () => ticketService.asset(id),
    enabled: ticketAccess(user).assets,
    staleTime: 60_000,
  });
  return (
    <li className="flex min-w-0 items-start gap-3 rounded-xl border border-cyan/20 bg-cyan/5 p-3">
      <div className="grid size-9 shrink-0 place-items-center rounded-lg border border-cyan/20 bg-background/40 text-cyan">
        <Box aria-hidden className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="break-words text-sm font-semibold">
          {asset.data?.name ??
            (asset.isFetching ? 'Loading Asset...' : 'Asset reference')}
        </p>
        {asset.data?.asset_type && (
          <p className="mt-0.5 text-xs text-cyan-ice">
            {asset.data.asset_type}
          </p>
        )}
        <details className="mt-1 text-xs text-muted-foreground">
          <summary className="cursor-pointer">Asset ID</summary>
          <span className="break-all font-mono">{id}</span>
        </details>
      </div>
      <button
        type="button"
        className="rounded-md p-2 text-muted-foreground hover:text-cyan focus-visible:outline-2 focus-visible:outline-cyan"
        aria-label={'Copy Asset ID ' + id}
        onClick={() =>
          void navigator.clipboard
            .writeText(id)
            .then(() => toast.success('Asset ID copied.'))
            .catch(() => toast.error('Unable to copy Asset ID.'))
        }
      >
        <Copy className="size-4" aria-hidden />
      </button>
    </li>
  );
}
export default function TicketAssetCards({ ids }: { ids: string[] }) {
  return ids.length ? (
    <ul className="grid gap-2">
      {ids.map((id) => (
        <AssetCard key={id} id={id} />
      ))}
    </ul>
  ) : (
    <p className="text-sm text-muted-foreground">No visible Asset links.</p>
  );
}
