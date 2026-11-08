import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/react-query/query-keys';
import { incidentService } from '@/services/incidents/incident-service';

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
  enabled = true
) {
  const normalizedIncidentId = incidentId?.trim() ?? '';

  return useQuery({
    queryKey: queryKeys.incidents.detail(normalizedIncidentId),
    queryFn: () => incidentService.getIncident(normalizedIncidentId),
    enabled: enabled && normalizedIncidentId.length > 0,
    staleTime: DEFAULT_INCIDENT_STALE_TIME,
  });
}

export function useRackAndChildIncidentsQuery(
  rackId: string,
  nodeCodes: string[],
  enabled = true,
  excludeStatus?: string
) {
  return useQuery({
    queryKey: ['rack-and-child-incidents', rackId, nodeCodes, excludeStatus],
    queryFn: async () => {
      // 1. Fetch rack incident
      const rackPromise = incidentService.listIncidents({
        scopeType: 'rack',
        scopeId: rackId,
        excludeStatus,
      });

      // 2. Fetch node incidents in parallel
      const nodePromises = nodeCodes.map((nodeCode) =>
        incidentService
          .listIncidents({
            scopeType: 'node',
            scopeId: nodeCode,
            excludeStatus,
          })
          .then((list) => {
            // If the return object is mapped, ensure array
            const arr = Array.isArray(list) ? list : [];
            return arr.map((item) => ({ ...item, nodeCode }));
          })
      );

      const [rackIncidents, ...nodeIncidentsLists] = await Promise.all([
        rackPromise,
        ...nodePromises,
      ]);

      const rackList = Array.isArray(rackIncidents) ? rackIncidents : [];
      const childIncidents = nodeIncidentsLists.flat();

      return {
        rackIncidents: rackList,
        childIncidents,
      };
    },
    enabled: enabled && !!rackId,
    staleTime: DEFAULT_INCIDENT_STALE_TIME,
    refetchInterval: 15_000,
  });
}
