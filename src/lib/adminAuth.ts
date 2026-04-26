export const ADMIN_COOKIE_NAME = "guesthouse_admin_session";

export function getAdminSessionToken() {
  return process.env.ADMIN_SESSION_TOKEN ?? "guesthouse-admin-token";
}

export function getAdminPassword() {
  return process.env.ADMIN_PASSWORD ?? "admin123";
}
