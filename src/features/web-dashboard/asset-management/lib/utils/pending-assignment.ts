import type { PendingAssignmentNodeView } from "@/types/assets";

const normalizeText = (value?: string | null) => value?.trim().toLowerCase() ?? "";

export function matchesPendingAssignmentNode(
  node: PendingAssignmentNodeView,
  query: string,
): boolean {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) return true;

  const hardware = node.discoveredNode?.hardware;
  const searchableValues = [
    node.nodeCode,
    node.displayName,
    node.hostname,
    node.nodeType,
    node.source,
    node.lifecycleState,
    node.assignmentState,
    node.origin,
    node.discoveredNode?.agentId,
    node.discoveredNode?.hostname,
    node.discoveredNode?.deviceType,
    node.discoveredNode?.source,
    hardware?.primaryIpv4,
    hardware?.macAddress,
    hardware?.hardwareSerial,
    hardware?.vendor,
    hardware?.model,
    hardware?.osProduct,
  ];

  return searchableValues.some((value) => normalizeText(value).includes(normalizedQuery));
}