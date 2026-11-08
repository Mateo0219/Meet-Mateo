import { NextRequest, NextResponse } from "next/server";
import { clientKey, createRateLimiter, createSessionToken, ownerPassword, passwordMatches, SESSION_COOKIE, SESSION_SECONDS } from "@/lib/moments-auth";
import { getMomentsStore } from "@/lib/moments-store";

export const dynamic = "force-dynamic";

const allowAttempt = createRateLimiter(5, 60_000);
const cookieOptions = { httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production", path: "/api/moments" } as const;

export async function POST(request: NextRequest) {
  const password = ownerPassword();
  if (!password || !getMomentsStore()) return NextResponse.json({ error: "朋友圈还没有配置" }, { status: 503 });
  if (!allowAttempt(clientKey(request))) return NextResponse.json({ error: "试得太频繁，请一分钟后再来" }, { status: 429 });

  const body = (await request.json().catch(() => null)) as { password?: unknown } | null;
  if (typeof body?.password !== "string" || !passwordMatches(body.password, password)) {
    return NextResponse.json({ error: "密码不对" }, { status: 401 });
  }
  const response = NextResponse.json({ owner: true });
  response.cookies.set(SESSION_COOKIE, createSessionToken(password), { ...cookieOptions, maxAge: SESSION_SECONDS });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ owner: false });
  response.cookies.set(SESSION_COOKIE, "", { ...cookieOptions, maxAge: 0 });
  return response;
}
