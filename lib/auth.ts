import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "ptk_session";
const SESSION_TTL = 60 * 60 * 12; // 12 hours
const LINK_TTL = 60 * 15; // 15 minutes

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET is not set");
  return new TextEncoder().encode(s);
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

export async function createSessionToken(email: string) {
  return new SignJWT({ email, purpose: "session" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL}s`)
    .sign(secret());
}

export async function verifyToken(token: string, purpose: "login" | "session") {
  try {
    const { payload } = await jwtVerify(token, secret());
    if (payload.purpose !== purpose || typeof payload.email !== "string") return null;
    if (!isAllowedEmail(payload.email)) return null;
    return payload.email;
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_TTL,
};

