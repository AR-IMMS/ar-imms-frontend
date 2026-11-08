import { httpGet } from "@/lib/http/http-methods";
import { INCIDENT_ENDPOINTS } from "@/lib/react-query/api-endpoint";
import type { IncidentDetail, IncidentListItem } from "@/types/incident";
import buildQueryString from "@/lib/utils/buildQueryString";

const INCIDENT_SERVICE_NAME = "incident";

export interface ListIncidentsParams {
  incidentCode?: string | null;
  status?: string | null;
  scopeType?: string | null;
  scopeId?: string | null;
  excludeStatus?: string | null;
}

export const incidentService = {
  listIncidents: (params?: ListIncidentsParams): Promise<IncidentListItem[]> => {
    const qs = params ? buildQueryString(params) : "";
    return httpGet<IncidentListItem[]>(`${INCIDENT_ENDPOINTS.INCIDENTS}${qs}`, {
      service: INCIDENT_SERVICE_NAME,
    });
  },
  getIncident: (incidentId: string): Promise<IncidentDetail> =>
    httpGet<IncidentDetail>(INCIDENT_ENDPOINTS.INCIDENT_BY_ID(incidentId), {
      service: INCIDENT_SERVICE_NAME,
    }),
};
