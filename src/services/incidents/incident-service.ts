import { httpGet } from "@/lib/http/http-methods";
import { INCIDENT_ENDPOINTS } from "@/lib/react-query/api-endpoint";
import type { IncidentDetail, IncidentListItem } from "@/types/incident";

const INCIDENT_SERVICE_NAME = "incident";

export const incidentService = {
  listIncidents: (): Promise<IncidentListItem[]> =>
    httpGet<IncidentListItem[]>(INCIDENT_ENDPOINTS.INCIDENTS, {
      service: INCIDENT_SERVICE_NAME,
    }),
  getIncident: (incidentId: string): Promise<IncidentDetail> =>
    httpGet<IncidentDetail>(INCIDENT_ENDPOINTS.INCIDENT_BY_ID(incidentId), {
      service: INCIDENT_SERVICE_NAME,
    }),
};
