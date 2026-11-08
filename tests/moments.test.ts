import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createRateLimiter, createSessionToken, passwordMatches, SESSION_SECONDS, verifySessionToken } from "../lib/moments-auth";
import { formatMomentTime, isImageName, parseDraft, sniffImage } from "../lib/moments";
import { createLocalStore, createSupabaseStore, getMomentsStore } from "../lib/moments-store";

const IMAGE = "12345678-1234-1234-1234-123456789abc.webp";

describe("parseDraft", () => {
  it("accepts text, images or both and trims", () => {
    expect(parseDraft({ text: "  你好  ", location: " 北京 ", images: [] })).toEqual({ ok: true, draft: { text: "你好", location: "北京", images: [] } });
    expect(parseDraft({ text: "", images: [IMAGE] }).ok).toBe(true);
  });

  it("rejects empty, oversized and malformed posts", () => {
    expect(parseDraft({ text: "   ", images: [] }).ok).toBe(false);
    expect(parseDraft({ text: "字".repeat(1001), images: [] }).ok).toBe(false);
    expect(parseDraft({ text: "a", images: Array(10).fill(IMAGE) }).ok).toBe(false);
    expect(parseDraft(null).ok).toBe(false);
  });

  it("refuses image names that could escape storage", () => {
    for (const name of ["../../etc/passwd", "a.svg", `${IMAGE}/x`, "https://evil.example/a.png"]) {
      expect(isImageName(name)).toBe(false);
      expect(parseDraft({ text: "a", images: [name] }).ok).toBe(false);
    }
  });
});

describe("sniffImage", () => {
  const bytes = (...values: number[]) => new Uint8Array([...values, ...Array(16).fill(0)]);
  it("recognises real image headers", () => {
    expect(sniffImage(bytes(0xff, 0xd8, 0xff))?.ext).toBe("jpg");
    expect(sniffImage(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a))?.ext).toBe("png");
    expect(sniffImage(new Uint8Array([...Buffer.from("RIFF"), 0, 0, 0, 0, ...Buffer.from("WEBP")]))?.ext).toBe("webp");
  });
  it("rejects SVG and HTML whatever they claim to be", () => {
    expect(sniffImage(new TextEncoder().encode("<svg onload=alert(1)></svg>"))).toBeNull();
    expect(sniffImage(new TextEncoder().encode("<html><script></script></html>"))).toBeNull();
  });
});

describe("formatMomentTime", () => {
  const now = new Date("2026-11-08T12:00:00Z"); // 20:00 in Beijing
  it("uses relative words close to now and dates further away", () => {
    expect(formatMomentTime("2026-11-08T11:59:30Z", now)).toBe("刚刚");
    expect(formatMomentTime("2026-11-08T11:30:00Z", now)).toBe("30 分钟前");
    expect(formatMomentTime("2026-11-08T09:00:00Z", now)).toBe("3 小时前");
    expect(formatMomentTime("2026-11-07T10:05:00Z", now)).toBe("昨天 18:05");
    expect(formatMomentTime("2026-10-01T04:00:00Z", now)).toBe("10月1日");
    expect(formatMomentTime("2025-10-01T04:00:00Z", now)).toBe("2025年10月1日");
  });
});

describe("owner session", () => {
  it("accepts its own token until it expires", () => {
    const token = createSessionToken("secret", 1000);
    expect(verifySessionToken(token, "secret", 2000)).toBe(true);
    expect(verifySessionToken(token, "secret", 1000 + SESSION_SECONDS * 1000 + 1)).toBe(false);
  });

  it("rejects forged, altered and old-password tokens", () => {
    const token = createSessionToken("secret", 1000);
    const [expires, signature] = token.split(".");
    expect(verifySessionToken(`9${expires}.${signature}`, "secret", 2000)).toBe(false);
    expect(verifySessionToken(token, "changed", 2000)).toBe(false);
    expect(verifySessionToken(undefined, "secret", 2000)).toBe(false);
    expect(verifySessionToken("garbage", "secret", 2000)).toBe(false);
  });

  it("compares passwords exactly", () => {
    expect(passwordMatches("abc", "abc")).toBe(true);
    expect(passwordMatches("abcd", "abc")).toBe(false);
  });

  it("limits attempts per key within the window", () => {
    const allow = createRateLimiter(2, 1000);
    expect([allow("a", 0), allow("a", 1), allow("a", 2), allow("b", 3), allow("a", 1001)]).toEqual([true, true, false, true, true]);
  });
});

describe("store selection", () => {
  it("never falls back to local files in production", () => {
    expect(getMomentsStore({ NODE_ENV: "production" })).toBeNull();
  });
  it("uses Supabase when configured", () => {
    expect(getMomentsStore({ NODE_ENV: "production", SUPABASE_URL: "https://x.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "k" })?.kind).toBe("supabase");
  });
});

describe("local store", () => {
  const directories: string[] = [];
  const store = () => {
    const directory = mkdtempSync(path.join(tmpdir(), "moments-"));
    directories.push(directory);
    return createLocalStore(directory);
  };
  const record = (id: string, createdAt: string) => ({ id, text: id, location: null, images: [], likes: 0, createdAt });
  afterEach(() => directories.splice(0).forEach((directory) => rmSync(directory, { recursive: true, force: true })));

  it("lists newest first and pages with before", async () => {
    const s = store();
    await s.create(record("old", "2026-01-01T00:00:00.000Z"));
    await s.create(record("new", "2026-02-01T00:00:00.000Z"));
    expect((await s.list(10)).map((item) => item.id)).toEqual(["new", "old"]);
    expect((await s.list(10, "2026-02-01T00:00:00.000Z")).map((item) => item.id)).toEqual(["old"]);
  });

  it("serialises concurrent likes and never goes below zero", async () => {
    const s = store();
    await s.create(record("a", "2026-01-01T00:00:00.000Z"));
    await Promise.all(Array.from({ length: 5 }, () => s.like("a", 1)));
    expect((await s.list(1))[0].likes).toBe(5);
    expect(await s.like("missing", 1)).toBeNull();
    for (let i = 0; i < 7; i += 1) await s.like("a", -1);
    expect((await s.list(1))[0].likes).toBe(0);
  });

  it("stores, reads and removes images", async () => {
    const s = store();
    await s.saveImage(IMAGE, new Uint8Array([1, 2, 3]), "image/webp");
    expect([...(await s.readImage!(IMAGE))!]).toEqual([1, 2, 3]);
    await s.deleteImages([IMAGE]);
    expect(await s.readImage!(IMAGE)).toBeNull();
    expect(await s.readImage!("../moments.json")).toBeNull();
  });
});

describe("supabase store", () => {
  const ok = (body: unknown) => new Response(JSON.stringify(body), { status: 200 });

  it("sends the service key and maps rows", async () => {
    const fetcher = vi.fn().mockResolvedValue(ok([{ id: "1", text: "t", location: null, images: ["a.webp"], likes: 2, created_at: "2026-01-01T00:00:00Z" }]));
    const store = createSupabaseStore("https://x.supabase.co/", "key", fetcher as unknown as typeof fetch);
    const [record] = await store.list(21, "2026-02-01T00:00:00.000Z");
    expect(record).toEqual({ id: "1", text: "t", location: null, images: ["a.webp"], likes: 2, createdAt: "2026-01-01T00:00:00Z" });
    const [url, init] = fetcher.mock.calls[0];
    expect(String(url)).toContain("/rest/v1/moments?");
    expect(String(url)).toContain("created_at=lt.2026-02-01");
    expect(init.headers.Authorization).toBe("Bearer key");
  });

  it("surfaces failures and builds public image URLs", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response("no", { status: 500 }));
    const store = createSupabaseStore("https://x.supabase.co", "key", fetcher as unknown as typeof fetch);
    await expect(store.like("id", 1)).rejects.toThrow("500");
    expect(store.imageUrl(IMAGE)).toBe(`https://x.supabase.co/storage/v1/object/public/moments/${IMAGE}`);
  });
});
