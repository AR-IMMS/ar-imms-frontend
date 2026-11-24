'use client';
import TicketEditor from './ticket-editor';
export default function CreateTicketModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (id: number) => void;
}) {
  return (
    <TicketEditor action="create" onClose={onClose} onCreated={onCreated} />
  );
}
