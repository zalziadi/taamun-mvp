const ADMIN_KEY = process.env.ADMIN_KEY;

export function isAdminRequest(key?: string) {
  return key === ADMIN_KEY;
}
