export type ParsedNodeQrPayload = {
  nodeId: string;
  nodeData?: string;
};

export function parseNodeQrPayload(payload: string): ParsedNodeQrPayload | null {
  const trimmed = payload.trim();

  if (!trimmed) {
    return null;
  }

  if (/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return { nodeId: trimmed };
  }

  if (trimmed.startsWith('{')) {
    return parseJsonNodePayload(trimmed);
  }

  try {
    const parsed = new URL(trimmed);
    const data = parseDataParam(parsed.searchParams.get('data'));

    if (parsed.protocol === 'arimms:' && parsed.hostname === 'ar') {
      const [, nodeId] = parsed.pathname.split('/');
      const sanitizedNodeId = sanitizeNodeId(nodeId);

      if (sanitizedNodeId) {
        return {
          nodeId: sanitizedNodeId,
          nodeData: data?.nodeData,
        };
      }

      return data;
    }

    const nodeId = parsed.searchParams.get('nodeId');
    if (nodeId) {
      const sanitizedNodeId = sanitizeNodeId(nodeId);
      return sanitizedNodeId
        ? {
            nodeId: sanitizedNodeId,
            nodeData: data?.nodeData,
          }
        : null;
    }
  } catch {
    return null;
  }

  return null;
}

export function normalizeNodeIdFromQrPayload(payload: string): string | null {
  return parseNodeQrPayload(payload)?.nodeId ?? null;
}

export function buildWebArUrl(baseUrl: string, nodeId: string, nodeData?: string) {
  const normalizedBase = baseUrl.trim();

  if (!normalizedBase) {
    return null;
  }

  try {
    const url = new URL(normalizedBase);
    url.searchParams.set('nodeId', nodeId);
    url.searchParams.set('mode', 'mock');
    if (nodeData) {
      url.searchParams.set('data', nodeData);
    }
    return url.toString();
  } catch {
    return null;
  }
}

function sanitizeNodeId(value?: string | null) {
  const decoded = decodeURIComponent(value ?? '').trim();
  return /^[a-zA-Z0-9_-]+$/.test(decoded) ? decoded : null;
}

function parseDataParam(value?: string | null): ParsedNodeQrPayload | null {
  if (!value) {
    return null;
  }

  try {
    return parseJsonNodePayload(value);
  } catch {
    return null;
  }
}

function parseJsonNodePayload(value: string): ParsedNodeQrPayload | null {
  try {
    const parsed = JSON.parse(value) as { id?: unknown; nodeId?: unknown };
    const rawNodeId = typeof parsed.id === 'string' ? parsed.id : parsed.nodeId;
    const nodeId = typeof rawNodeId === 'string' ? sanitizeNodeId(rawNodeId) : null;

    if (!nodeId) {
      return null;
    }

    return {
      nodeId,
      nodeData: JSON.stringify(parsed),
    };
  } catch {
    return null;
  }
}
