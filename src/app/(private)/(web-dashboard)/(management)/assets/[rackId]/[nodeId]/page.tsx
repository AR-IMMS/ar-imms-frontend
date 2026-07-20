interface Props {
  params: Promise<{ rackId: string; nodeId: string }>;
}

export default async function NodeDetailPage({ params }: Props) {
  const { nodeId } = await params;

  return (
    <div className="flex gap-6">
      <h3 className="text-lg font-bold">NODE TELEMETRY: {nodeId}</h3>
    </div>
  );
}
