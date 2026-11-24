import { apiConfig } from './config';
import { requestJson } from './client';

export interface TechnicianOption {
  id: string;
  username: string;
  email: string;
  fullName: string;
  jobTitle?: string;
  department?: string;
}

export async function listTechnicians(token: string): Promise<TechnicianOption[]> {
  return requestJson<TechnicianOption[]>(apiConfig.identityApiUrl, '/technicians', {
    token,
  });
}
