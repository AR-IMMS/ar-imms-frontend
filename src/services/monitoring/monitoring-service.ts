import { httpGet } from "@/lib/http/http-methods";
import { MONITORING_ENDPOINTS } from "@/lib/react-query/api-endpoint";
import buildQueryString from "@/lib/utils/buildQueryString";
import type {
  NodeMetricsData,
  NodeMetricsQueryParams,
  NodeOverviewData,
  RackInvestigationOverviewResponse,
} from "@/types/monitoring";

const SERVICE_NAME = "monitoring";

export const monitoringService = {
  getRackOverview: (rackId: string): Promise<RackInvestigationOverviewResponse> =>
    httpGet<RackInvestigationOverviewResponse>(MONITORING_ENDPOINTS.RACKS_OVERVIEW(rackId), {
      service: SERVICE_NAME,
    }),

  getNodeOverview: (nodeCode: string): Promise<NodeOverviewData> =>
    httpGet<NodeOverviewData>(MONITORING_ENDPOINTS.NODE_OVERVIEW(nodeCode), {
      service: SERVICE_NAME,
    }),
  
    // metrics points update by minute
  getNodeMetrics: (
    nodeCode: string,
    params?: NodeMetricsQueryParams,
  ): Promise<NodeMetricsData> =>
    httpGet<NodeMetricsData>(
      `${MONITORING_ENDPOINTS.NODE_METRICS(nodeCode)}${buildQueryString(params ?? {})}`,
      { service: SERVICE_NAME },
    ),

  // metrics points update by second  
  getNodeMetricsLive: (
    nodeCode: string,
    params?: NodeMetricsQueryParams,
  ): Promise<NodeMetricsData> =>
    httpGet<NodeMetricsData>(
      `${MONITORING_ENDPOINTS.NODE_METRICS_LIVE(nodeCode)}${buildQueryString(params ?? {})}`,
      { service: SERVICE_NAME },
    ),
};
