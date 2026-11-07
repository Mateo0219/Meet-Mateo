import { describe, expect, it, vi } from "vitest";
import { fetchNeteasePlaylist } from "../lib/netease-playlist";

const song = (id: number) => ({ id, name: `Song ${id}`, ar: [{ name: "Artist" }], al: { picUrl: "https://p1.music.126.net/cover.jpg" } });
const reply = (body: unknown) => new Response(JSON.stringify(body), { headers: { "content-type": "application/json" } });

describe("complete public playlist loading", () => {
  it("resolves past the embedded preview, batches requests, and preserves playlist order", async () => {
    const ids = Array.from({ length: 315 }, (_, i) => 500 - i);
    let inFlight = 0;
    let maxInFlight = 0;
    const batches: number[][] = [];
    const fetcher = vi.fn<typeof fetch>(async input => {
      const url = new URL(String(input));
      if (url.pathname.includes("playlist/detail")) return reply({ code: 200, playlist: {
        name: "My likes", trackCount: 318, trackIds: ids.map(id => ({ id })), tracks: [song(ids[0])],
      } });
      const batch = (JSON.parse(url.searchParams.get("c")!) as { id: number }[]).map(x => x.id);
      batches.push(batch);
      inFlight++;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise(resolve => setTimeout(resolve, 1));
      inFlight--;
      return reply({ code: 200, songs: [...batch].reverse().map(song) });
    });
    const result = await fetchNeteasePlaylist("539209250", fetcher);
    expect(result.tracks.map(t => Number(t.id))).toEqual(ids);
    expect(result.trackCount).toBe(318);
    expect(result.availableCount).toBe(315);
    expect(batches.flat()).toEqual(ids.slice(1));
    expect(Math.max(...batches.map(b => b.length))).toBeLessThanOrEqual(100);
    expect(maxInFlight).toBeLessThanOrEqual(3);
  });

  it("does not treat an upstream business error with HTTP 200 as an empty playlist", async () => {
    const fetcher = vi.fn<typeof fetch>(async () => reply({ code: 20001 }));
    await expect(fetchNeteasePlaylist("539209250", fetcher)).rejects.toThrow();
  });

  it("rejects a failed detail batch instead of saving a partial refresh", async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(reply({ code: 200, playlist: { name: "Likes", trackCount: 2, trackIds: [{ id: 1 }, { id: 2 }], tracks: [song(1)] } }))
      .mockResolvedValueOnce(new Response("Unavailable", { status: 503 }));
    await expect(fetchNeteasePlaylist("539209250", fetcher)).rejects.toThrow("503");
  });

  it("keeps missing songs visible in the count rather than fabricating records", async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(reply({ code: 200, playlist: { name: "Likes", trackCount: 3, trackIds: [{ id: 1 }, { id: 2 }], tracks: [] } }))
      .mockResolvedValueOnce(reply({ code: 200, songs: [song(1)] }));
    const result = await fetchNeteasePlaylist("539209250", fetcher);
    expect(result.trackCount).toBe(3);
    expect(result.availableCount).toBe(1);
  });

  it("rejects unsafe IDs before making a network request", async () => {
    const fetcher = vi.fn<typeof fetch>();
    await expect(fetchNeteasePlaylist("123&other=1", fetcher)).rejects.toThrow();
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("bounds a chunked upstream response even without Content-Length", async () => {
    const fetcher = vi.fn<typeof fetch>(async () => new Response("x".repeat(1_000_001)));
    await expect(fetchNeteasePlaylist("539209250", fetcher)).rejects.toThrow("响应过大");
  });
});
