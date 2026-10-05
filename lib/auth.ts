import { SignJWT, jwtVerify } from "jose";
import { requireEnv } from "./config";

export const SESSION_COOKIE = "ptk_session";
const SESSION_TTL = 60 * 60 * 12; // 12 hours
const LINK_TTL = 60 * 15; // 15 minutes

function secret() {
  return new TextEncoder().encode(requireEnv("AUTH_SECRET"));
}

export function allowedDomain() {
  return (process.env.ALLOWED_EMAIL_DOMAIN || "primetekssc.ng").toLowerCase();
}

export function isAllowedEmail(email: string) {
  return email.toLowerCase().endsWith("@" + allowedDomain());
}

export async function createLoginToken(email: string) {
  return new SignJWT({ email, purpose: "login" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${LINK_TTL}s`)
    .sign(secret());
}

export type Role = "staff" | "admin";

export async function createSessionToken(email: string, role: Role = "staff") {
  return new SignJWT({ email, role, purpose: "session" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL}s`)
    .sign(secret());
}

export async function verifyToken(token: string, purpose: "login" | "session") {
  return (await verifySession(token, purpose))?.email ?? null;
}

export async function verifySession(token: string, purpose: "login" | "session" = "session") {
  try {
    const { payload } = await jwtVerify(token, secret());
    if (payload.purpose !== purpose || typeof payload.email !== "string") return null;
    if (!isAllowedEmail(payload.email)) return null;
    return { email: payload.email, role: (payload.role === "admin" ? "admin" : "staff") as Role };
  } catch {
    return null;
  }
}

export function adminEmail() {
  return (process.env.ADMIN_EMAIL || "admin@" + allowedDomain()).toLowerCase();
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_TTL,
};

