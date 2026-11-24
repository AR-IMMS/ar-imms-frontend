type Principal =
  | {
      id?: string;
      roleCodes?: readonly string[];
      permissions?: readonly string[];
      status?: string;
      mustChangePassword?: boolean;
    }
  | null
  | undefined;
export function ticketAccess(user: Principal) {
  const roles = user?.roleCodes ?? [];
  const admin =
    roles.includes('IT_ADMINISTRATOR') || roles.includes('IT_ADMIN');
  const active =
    !admin && user?.status === 'ACTIVE' && !user.mustChangePassword;
  const operator =
    active &&
    (roles.includes('OPERATOR') ||
      roles.includes('SYSTEM_MONITORING_OPERATOR'));
  const technician =
    active &&
    (roles.includes('TECHNICIAN') || roles.includes('MAINTENANCE_TECHNICIAN'));
  const allowed = (code: string) => user?.permissions?.includes(code) === true;
  const read = Boolean((operator || technician) && allowed('ticket:read'));
  return {
    read,
    operator,
    technician,
    create: read && operator && allowed('ticket:create'),
    manage: read && operator && allowed('ticket:manage'),
    work: read && allowed('ticket:work'),
    close: read && allowed('ticket:close'),
    reopen: read && allowed('ticket:manage'),
    assets: read && allowed('asset:read'),
  };
}
export function ticketHome(user: Principal) {
  const access = ticketAccess(user);
  return access.read ? (access.operator ? '/tickets' : '/tickets/me') : null;
}
