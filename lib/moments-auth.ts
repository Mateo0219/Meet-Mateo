import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";

export const SESSION_COOKIE = "moments_session";
export const SESSION_SECONDS = 30 * 24 * 60 * 60;

const safeEqual = (a: Buffer, b: Buffer) => a.length === b.length && timingSafeEqual(a, b);
const digest = (value: string) => createHash("sha256").update(value).digest();
// One secret to manage: changing MOMENTS_PASSWORD also signs out every session.
const sign = (expires: string, password: string) => createHmac("sha256", password).update(`moments-session:${expires}`).digest("hex");

export const passwordMatches = (attempt: string, password: string) => safeEqual(digest(attempt), digest(password));

export function createSessionToken(password: string, now = Date.now()): string {
  const expires = String(now + SESSION_SECONDS * 1000);
  return `${expires}.${sign(expires, password)}`;
}

export function verifySessionToken(token: string | undefined, password: string, now = Date.now()): boolean {
  if (!token) return false;
  const [expires, signature, extra] = token.split(".");
  if (!expires || !signature || extra !== undefined || !/^\d+$/.test(expires)) return false;
  if (Number(expires) <= now) return false;
  return safeEqual(Buffer.from(signature), Buffer.from(sign(expires, password)));
}

export const ownerPassword = () => process.env.MOMENTS_PASSWORD || null;

export function isOwner(request: NextRequest): boolean {
  const password = ownerPassword();
  return password ? verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value, password) : false;
}

export const clientKey = (request: NextRequest) => request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";

/** Best effort: on serverless each instance counts separately, which still slows guessing a lot. */
export function createRateLimiter(limit: number, windowMs: number) {
  const hits = new Map<string, { count: number; resetAt: number }>();
  return (key: string, now = Date.now()): boolean => {
    if (hits.size > 5000) for (const [entry, value] of hits) if (value.resetAt <= now) hits.delete(entry);
    const current = hits.get(key);
    if (!current || current.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return true;
    }
    current.count += 1;
    return current.count <= limit;
  };
}
