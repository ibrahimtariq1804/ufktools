import { cookies } from "next/headers";
import crypto from "crypto";

export interface SessionData {
  adminId: string;
  email: string;
  name: string;
  issuedAt: number;
  expiresAt: number;
}

const COOKIE_NAME = "ufk_admin_session";
const SESSION_DURATION_DAYS = 7;
const SESSION_SECRET =
  process.env.SESSION_SECRET || "ufk-tools-production-secret-encryption-key-2026-safe";

// HMAC Token Signer & Verifier using standard Web Crypto / Node crypto
function signPayload(payload: string): string {
  const hmac = crypto.createHmac("sha256", SESSION_SECRET);
  hmac.update(payload);
  return hmac.digest("hex");
}

export function createToken(data: SessionData): string {
  const payload = Buffer.from(JSON.stringify(data)).toString("base64url");
  const signature = signPayload(payload);
  return `${payload}.${signature}`;
}

export function verifyToken(token: string): SessionData | null {
  try {
    const [payload, signature] = token.split(".");
    if (!payload || !signature) return null;

    const expectedSignature = signPayload(payload);
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return null;
    }

    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf-8")) as SessionData;
    if (Date.now() > decoded.expiresAt) {
      return null;
    }

    return decoded;
  } catch {
    return null;
  }
}

export async function setAdminSession(adminId: string, email: string, name: string) {
  const now = Date.now();
  const expiresAt = now + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000;

  const sessionData: SessionData = {
    adminId,
    email,
    name,
    issuedAt: now,
    expiresAt,
  };

  const token = createToken(sessionData);
  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_DAYS * 24 * 60 * 60,
  });

  return sessionData;
}

export async function getAdminSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(COOKIE_NAME);
  if (!cookie || !cookie.value) return null;

  return verifyToken(cookie.value);
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
