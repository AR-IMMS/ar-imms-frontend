export function coreOrigin(config?: string) {
  if (!config) return '';
  const url = new URL(config);
  if (
    !['http:', 'https:'].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    !['/', '/api/v1', '/api/v1/'].includes(url.pathname)
  ) {
    throw new Error(
      'Ticket API URL must be the Core origin or its /api/v1 base.'
    );
  }
  return url.origin;
}
