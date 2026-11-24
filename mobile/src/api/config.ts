import Constants from 'expo-constants';
import { coreBase } from './core-contract';
const extra = (Constants.expoConfig?.extra ?? {}) as { identityApiUrl?: string; incidentApiUrl?: string; webarUrl?: string };
export const apiConfig = {
  coreApiUrl: coreBase(process.env.EXPO_PUBLIC_CORE_API_URL),
  ticketStateIds: process.env.EXPO_PUBLIC_TICKET_STATE_IDS,
  identityApiUrl: process.env.EXPO_PUBLIC_IDENTITY_API_URL ?? extra.identityApiUrl ?? '',
  incidentApiUrl: process.env.EXPO_PUBLIC_INCIDENT_API_URL ?? extra.incidentApiUrl ?? '',
  webarUrl: process.env.EXPO_PUBLIC_WEBAR_URL ?? extra.webarUrl ?? '',
};
