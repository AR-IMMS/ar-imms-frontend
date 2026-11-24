import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Circle,
  MinusCircle,
} from 'lucide-react';
import type { TicketPriorityMetadata } from '@/services/tickets/ticket-service';
const icons = {
  green: CheckCircle2,
  cyan: MinusCircle,
  amber: AlertTriangle,
  critical: AlertOctagon,
  neutral: Circle,
};
export default function TicketPriorityIcon({
  tone,
}: {
  tone: TicketPriorityMetadata['color'];
}) {
  const Icon = icons[tone];
  return <Icon className="size-3.5 shrink-0" aria-hidden />;
}
