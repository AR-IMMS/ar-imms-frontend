import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/react-query/query-keys";
import { incidentService } from "@/services/incidents/incident-service";

const DEFAULT_INCIDENT_STALE_TIME = 15_000;

export function useIncidentsQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.incidents.all,
    queryFn: () => incidentService.listIncidents(),
    enabled,
    staleTime: DEFAULT_INCIDENT_STALE_TIME,
  });
}

export function useIncidentDetailQuery(
  incidentId?: string | null,
  enabled = true,
) {
  const normalizedIncidentId = incidentId?.trim() ?? "";

  return useQuery({
    queryKey: queryKeys.incidents.detail(normalizedIncidentId),
    queryFn: () => incidentService.getIncident(normalizedIncidentId),
    enabled: enabled && normalizedIncidentId.length > 0,
    staleTime: DEFAULT_INCIDENT_STALE_TIME,
  });
}
