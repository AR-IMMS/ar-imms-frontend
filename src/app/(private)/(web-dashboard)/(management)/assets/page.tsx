import { TopologyPage } from "@/features/web-dashboard/asset-management/data-center-view";

// Data center/Row layer
export default function AssetOverviewtPage() {
  return (
    <div className="flex gap-6 w-full flex-1 min-h-0 overflow-hidden">
      <TopologyPage />
    </div>
  );
}
