interface Props {
  params: Promise<{ rackId: string }>;
}

export default async function RackOverviewPage({ params }: Props) {
  const { rackId } = await params;
  // const rackData = await getRackDetails(rackId);

  return (
    <div className="flex gap-6">
      <h3 className="text-lg font-bold">
        {rackId.toUpperCase()} - DIGITAL TWIN MESH
      </h3>
    </div>
  );
}
