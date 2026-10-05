import { cookies } from "next/headers";
import { SESSION_COOKIE, verifyToken } from "./auth";

/** Returns the signed-in staff email, or null. For route handlers and server components. */
export async function getSessionEmail() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return token ? verifyToken(token, "session") : null;
}
