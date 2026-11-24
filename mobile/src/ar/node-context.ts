export type NodeHealth = 'nominal' | 'warning' | 'critical';

export interface NodeContext {
  id: string;
  name: string;
  rack: string;
  status: NodeHealth;
  temperatureC: number;
  cpuPercent: number;
  memoryPercent: number;
  networkLatencyMs: number;
  activeTicketCount: number;
  lastTicketCode: string;
  updatedAt: string;
}

const mockNodes: Record<string, NodeContext> = {
  'mock-node-001': {
    id: 'mock-node-001',
    name: 'Node AX-0421',
    rack: 'Rack A1',
    status: 'nominal',
    temperatureC: 41.8,
    cpuPercent: 38,
    memoryPercent: 62,
    networkLatencyMs: 12,
    activeTicketCount: 0,
    lastTicketCode: 'TCK-R2-002',
    updatedAt: 'Live mock',
  },
  'node-rack-b7': {
    id: 'node-rack-b7',
    name: 'Node BX-1109',
    rack: 'Rack B7',
    status: 'critical',
    temperatureC: 84.2,
    cpuPercent: 91,
    memoryPercent: 77,
    networkLatencyMs: 38,
    activeTicketCount: 2,
    lastTicketCode: 'TCK-WEB-79528',
    updatedAt: 'Live mock',
  },
  'node-dx-2204': {
    id: 'node-dx-2204',
    name: 'Node DX-2204',
    rack: 'Rack D5',
    status: 'warning',
    temperatureC: 63.4,
    cpuPercent: 54,
    memoryPercent: 69,
    networkLatencyMs: 320,
    activeTicketCount: 1,
    lastTicketCode: 'TCK-MOB-8361',
    updatedAt: 'Live mock',
  },
};

export function getNodeContext(nodeId: string, nodeData?: string): NodeContext {
  return getNodeContextFromQrData(nodeData) ?? getMockNodeContext(nodeId);
}

export async function fetchNodeContext(
  apiBaseUrl: string,
  nodeId: string,
  signal?: AbortSignal,
): Promise<NodeContext> {
  const baseUrl = apiBaseUrl.trim().replace(/\/$/, '');

  if (!baseUrl) {
    throw new Error('AR node API URL is not configured.');
  }

  const response = await fetch(`${baseUrl}/${encodeURIComponent(nodeId)}.json`, {
    signal,
  });

  if (!response.ok) {
    throw new Error(`Node context request failed with HTTP ${response.status}.`);
  }

  const json = (await response.json()) as Partial<NodeContext> & { nodeId?: string };
  const parsed = parseNodeContext(json, nodeId);

  if (!parsed) {
    throw new Error('Node context response is invalid.');
  }

  return parsed;
}

function getMockNodeContext(nodeId: string): NodeContext {
  return (
    mockNodes[nodeId] ?? {
      ...mockNodes['mock-node-001'],
      id: nodeId,
      name: `Node ${nodeId}`,
      rack: 'Unmapped Rack',
      status: 'warning',
      activeTicketCount: 1,
      lastTicketCode: 'PENDING-MAP',
    }
  );
}

function getNodeContextFromQrData(value?: string): NodeContext | null {
  if (!value) {
    return null;
  }

  try {
    return parseNodeContext(JSON.parse(value), undefined, 'QR payload');
  } catch {
    return null;
  }
}

function parseNodeContext(
  value: unknown,
  fallbackNodeId?: string,
  fallbackUpdatedAt = 'Fetched mock',
): NodeContext | null {
  const parsed = value as Partial<NodeContext> & { nodeId?: string };
  const id = sanitizeString(parsed.id ?? parsed.nodeId) ?? fallbackNodeId;

  if (!id) {
    return null;
  }

  const fallback = getMockNodeContext(id);

  return {
    id,
    name: sanitizeString(parsed.name) ?? fallback.name,
    rack: sanitizeString(parsed.rack) ?? fallback.rack,
    status: sanitizeStatus(parsed.status) ?? fallback.status,
    temperatureC: sanitizeNumber(parsed.temperatureC) ?? fallback.temperatureC,
    cpuPercent: sanitizeNumber(parsed.cpuPercent) ?? fallback.cpuPercent,
    memoryPercent: sanitizeNumber(parsed.memoryPercent) ?? fallback.memoryPercent,
    networkLatencyMs: sanitizeNumber(parsed.networkLatencyMs) ?? fallback.networkLatencyMs,
    activeTicketCount: sanitizeNumber(parsed.activeTicketCount) ?? fallback.activeTicketCount,
    lastTicketCode: sanitizeString(parsed.lastTicketCode) ?? fallback.lastTicketCode,
    updatedAt: sanitizeString(parsed.updatedAt) ?? fallbackUpdatedAt,
  };
}

function sanitizeString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function sanitizeNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function sanitizeStatus(value: unknown): NodeHealth | null {
  return value === 'nominal' || value === 'warning' || value === 'critical'
    ? value
    : null;
}
