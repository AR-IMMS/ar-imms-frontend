import { Linking } from 'react-native';

import { apiConfig } from '../api/config';
import { buildWebArUrl, parseNodeQrPayload } from './qr';

export async function openWebAr(
  nodeId?: string,
  nodeData?: string,
) {
  const baseUrl = apiConfig.webarUrl.trim();
  const targetUrl = nodeId ? buildWebArUrl(baseUrl, nodeId, nodeData) : baseUrl;

  if (!targetUrl) {
    throw new Error('WebAR URL is not configured for this build.');
  }

  await Linking.openURL(targetUrl);
}

export async function openWebArFromQr(payload: string) {
  const markerCode = parseMarkerCode(payload);

  if (markerCode) {
    const url = buildMarkerWebArUrl(markerCode);
    await Linking.openURL(url);
    return;
  }

  const node = parseNodeQrPayload(payload);
  if (node) {
    await openWebAr(node.nodeId, node.nodeData);
    return;
  }

  throw new Error('This QR is not a valid AR-IMMS asset marker.');
}

function buildMarkerWebArUrl(markerCode: string) {
  const baseUrl = apiConfig.webarUrl.trim();
  if (!baseUrl) {
    throw new Error('WebAR URL is not configured for this build.');
  }

  try {
    const url = new URL(baseUrl);
    url.searchParams.set('markerCode', markerCode);
    return url.toString();
  } catch {
    throw new Error('The configured WebAR URL is invalid.');
  }
}

function parseMarkerCode(payload: string) {
  const trimmed = payload.trim();
  if (/^AR-(NODE|RACK)-[A-Z0-9_-]+$/i.test(trimmed)) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed);
    const queryMarker = url.searchParams.get('markerCode')?.trim();
    if (queryMarker && /^[A-Z0-9_-]+$/i.test(queryMarker)) {
      return queryMarker;
    }

    if (url.protocol === 'arimms:' && url.hostname === 'ar') {
      const segments = url.pathname.split('/').filter(Boolean);
      const deepLinkMarker = segments[0] === 'marker' ? segments[1] : undefined;
      if (deepLinkMarker && /^[A-Z0-9_-]+$/i.test(deepLinkMarker)) {
        return decodeURIComponent(deepLinkMarker);
      }
    }
  } catch {
    return null;
  }

  return null;
}
