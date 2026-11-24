import { apiConfig } from './config';
import { requestJson } from './client';
import type { IncidentProps, IncidentSeverity, IncidentStatus } from '../types/incident';

type IncidentApiShape = Partial<IncidentProps> & {
  props?: IncidentApiShape;
  state?: {
    severity?: IncidentSeverity;
    status?: IncidentStatus;
    createdAt?: string;
    updatedAt?: string;
  };
  summary?: { whatHappened?: string };
  tickets?: Array<{ id?: string }>;
};

function normalizeIncident(value: unknown): IncidentProps {
  const envelope = value as IncidentApiShape;
  const incident = envelope.props ?? envelope;
  const severity = incident.severity ?? incident.state?.severity;
  const status = incident.status ?? incident.state?.status;

  if (!incident.id || !incident.incidentCode || !incident.title || !severity || !status) {
    throw new Error('Incident response is missing required workflow fields.');
  }

  const ticketIds = incident.ticketIds ??
    incident.tickets?.flatMap((ticket) => ticket.id ? [ticket.id] : []) ??
    [];

  return {
    id: incident.id,
    incidentCode: incident.incidentCode,
    title: incident.title,
    description: incident.description ?? incident.summary?.whatHappened,
    severity,
    status,
    ticketIds,
    ticketCount: incident.ticketCount ?? ticketIds.length,
    createdAt: incident.createdAt ?? incident.state?.createdAt ?? '',
    updatedAt: incident.updatedAt ?? incident.state?.updatedAt ?? '',
  };
}

export async function listIncidents(token: string): Promise<IncidentProps[]> {
  const incidents = await requestJson<unknown[]>(
    apiConfig.incidentApiUrl,
    '/incidents',
    { token },
  );

  return incidents.map(normalizeIncident);
}

export async function getIncident(
  incidentId: string,
  token: string,
): Promise<IncidentProps> {
  return normalizeIncident(
    await requestJson<unknown>(
      apiConfig.incidentApiUrl,
      `/incidents/${incidentId}`,
      { token },
    ),
  );
}
