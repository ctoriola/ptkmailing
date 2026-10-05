import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySession } from "./auth";
import { AppError } from "./errors";

export async function getSession() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return token ? verifySession(token) : null;
}

/** Returns the signed-in staff email, or null. For route handlers and server components. */
export async function getSessionEmail() {
  return (await getSession())?.email ?? null;
}

export async function requireAdmin() {
  const s = await getSession();
  if (s?.role !== "admin") throw new AppError(403, "Admin access required.", "Sign in at /admin/login.", "forbidden");
  return s;
}
