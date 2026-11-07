import { normalizeNeteasePlaylist, type PlaylistTrack } from "./netease-music";
import { isValidResourceId } from "./music-security";

export interface MusicPlaylist {
  id: string;
  name: string;
  url: string;
  trackCount: number;
  availableCount: number;
  tracks: PlaylistTrack[];
}

const MAX_RESPONSE_BYTES = 1_000_000;
const SONG_BATCH_SIZE = 100;
const CONCURRENCY = 3;

async function requestJson(url: URL, fetcher: typeof fetch): Promise<Record<string, unknown>> {
  const response = await fetcher(url, {
    headers: { Referer: "https://music.163.com/", "User-Agent": "Mozilla/5.0" },
    redirect: "error",
    signal: AbortSignal.timeout(8_000),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`网易云请求失败: ${response.status}`);
  if (Number(response.headers.get("content-length")) > MAX_RESPONSE_BYTES) {
    throw new Error("歌单响应过大");
  }
  const reader = response.body?.getReader();
  if (!reader) throw new Error("歌单响应为空");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_RESPONSE_BYTES) {
        await reader.cancel();
        throw new Error("歌单响应过大");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  const data: unknown = JSON.parse(new TextDecoder().decode(bytes));
  if (!data || typeof data !== "object" || !("code" in data) || data.code !== 200) {
    throw new Error("网易云未返回可读取的歌单数据");
  }
  return data as Record<string, unknown>;
}

export async function fetchNeteasePlaylist(id: string, fetcher: typeof fetch = fetch): Promise<MusicPlaylist> {
  if (!isValidResourceId(id)) throw new Error("无效的歌单 ID");
  const url = new URL("https://music.163.com/api/v6/playlist/detail");
  url.search = new URLSearchParams({ id, n: "100000", s: "0" }).toString();
  const data = await requestJson(url, fetcher);
  const playlist = data.playlist as Record<string, unknown> | undefined;
  if (!playlist || typeof playlist.name !== "string" || !Array.isArray(playlist.trackIds)) {
    throw new Error("歌单数据格式无效");
  }
  const ids = [...new Set(playlist.trackIds.map((track: unknown) => {
    const value = (track as { id?: unknown } | null)?.id;
    if (typeof value !== "number" || !Number.isSafeInteger(value) || value <= 0) {
      throw new Error("歌单包含无效的歌曲 ID");
    }
    return String(value);
  }))];
  if (ids.length > 10_000) throw new Error("歌单歌曲过多");

  // The detail response only embeds a preview. Resolve every public track ID.
  const byId = new Map(normalizeNeteasePlaylist(data).map(track => [track.id, track]));
  const missing = ids.filter(trackId => !byId.has(trackId));
  for (let start = 0; start < missing.length; start += SONG_BATCH_SIZE * CONCURRENCY) {
    const requests = [];
    for (let batch = 0; batch < CONCURRENCY; batch++) {
      const batchIds = missing.slice(start + batch * SONG_BATCH_SIZE, start + (batch + 1) * SONG_BATCH_SIZE);
      if (!batchIds.length) break;
      const songsUrl = new URL("https://music.163.com/api/v3/song/detail");
      songsUrl.searchParams.set("c", JSON.stringify(batchIds.map(trackId => ({ id: Number(trackId) }))));
      requests.push(requestJson(songsUrl, fetcher));
    }
    // Fail the refresh if a batch fails; don't cache a silently truncated list.
    const batches = await Promise.all(requests);
    for (const batch of batches) {
      if (!Array.isArray(batch.songs)) throw new Error("歌曲详情格式无效");
      for (const track of normalizeNeteasePlaylist(batch)) byId.set(track.id, track);
    }
  }
  const tracks = ids.flatMap(trackId => {
    const track = byId.get(trackId);
    return track ? [track] : [];
  });
  if (ids.length && !tracks.length) throw new Error("未能读取歌单曲目");
  const declaredCount = typeof playlist.trackCount === "number" && Number.isSafeInteger(playlist.trackCount)
    ? playlist.trackCount : ids.length;
  return {
    id,
    name: playlist.name,
    url: `https://music.163.com/playlist?id=${id}`,
    trackCount: Math.max(declaredCount, ids.length),
    availableCount: tracks.length,
    tracks,
  };
}
