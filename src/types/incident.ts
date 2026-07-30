export type IncidentSeverity = "INFO" | "WARNING" | "CRITICAL";

export type IncidentStatus = "OPEN" | "RESOLVED" | "CLOSED";

export interface IncidentListItem {
  id: string;
  incidentCode: string;
  title: string;
  severity: IncidentSeverity | string;
  status: IncidentStatus | string;
  ticketCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface IncidentScopeSummary {
  type: string;
  id: string;
  rackId?: string;
  nodeId?: string;
}

export interface IncidentDetail {
  id: string;
  incidentCode: string;
  title: string;
  state: {
    status: IncidentStatus | string;
    severity: IncidentSeverity | string;
    createdAt: string;
    updatedAt: string;
    resolvedAt?: string | null;
    closedAt?: string | null;
  };
  summary: {
    whatHappened: string;
    scope: IncidentScopeSummary;
    urgency?: string;
  };
  sourceFacts: {
    alert?: {
      fingerprint?: string;
      name?: string;
      severity?: string;
      category?: string;
      environment?: string;
      team?: string;
      startedAt?: string;
      lastReceivedAt?: string;
    };
    trigger?: {
      metricKey?: string;
      currentValue?: number | string;
      threshold?: number | string;
      unit?: string;
      observedWindow?: string;
    };
    asset?: {
      displayName?: string;
      siteCode?: string;
      roomCode?: string;
      rackCode?: string;
    };
    impact?: {
      affectedNodeCount?: number;
      totalNodeCount?: number;
      affectedRatio?: number;
      criticalNodeCount?: number;
      silentDeadNodeCount?: number;
    };
  };
  evidence: {
    type: string;
    capturedAt?: string;
    window?: {
      from?: string;
      to?: string;
      interval?: string;
    };
    completeness?: string;
    metrics?: Array<{
      metricKey: string;
      label?: string;
      value?: number | string;
      unit?: string;
      observedAt?: string;
    }>;
    unavailableSources?: Array<{
      source?: string;
      reasonCode?: string;
    }>;
  };
  alerts?: Array<{
    fingerprint?: string;
    name?: string;
    severity?: string;
    category?: string;
    environment?: string;
    team?: string;
    role?: string;
    startedAt?: string;
    lastReceivedAt?: string;
  }>;
  tickets?: Array<{
    id: string;
  }>;
  links?: {
    dashboardUrl?: string;
    runbookUrl?: string;
  };
  sourceRefs?: Array<{
    system?: string;
    dataset?: string;
    observedAt?: string;
  }>;
  relatedIncidents?: Array<{
    id: string;
    incidentCode: string;
    title: string;
    severity: IncidentSeverity | string;
    status: IncidentStatus | string;
    createdAt: string;
    updatedAt: string;
  }>;
}
