import { z } from 'zod';
import type { RoleCode, UserProfileResponse } from '@/types/auth';

const roles = {
  IT_ADMIN: 'IT_ADMINISTRATOR',
  OPERATOR: 'SYSTEM_MONITORING_OPERATOR',
  TECHNICIAN: 'MAINTENANCE_TECHNICIAN',
} as const satisfies Record<string, RoleCode>;
const permission = z.string().regex(/^[a-z]+:[a-z]+$/);
const profile = z.object({
  user_id: z.uuid(),
  username: z.string(),
  email: z.string(),
  display_name: z.string().nullish(),
  role: z.enum(['IT_ADMIN', 'OPERATOR', 'TECHNICIAN']),
  status: z.enum(['ACTIVE', 'INACTIVE']),
  effective_permissions: z.array(permission),
  must_change_password: z.boolean(),
});
export function mapCoreProfile(value: unknown): UserProfileResponse {
  const user = profile.parse(value);
  return {
    id: user.user_id,
    username: user.username,
    email: user.email,
    fullName: user.display_name ?? user.username,
    roleCodes: [roles[user.role]],
    status: user.status,
    permissions: user.effective_permissions,
    mustChangePassword: user.must_change_password,
  };
}
