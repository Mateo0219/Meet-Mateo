"use client";

import { useEffect, useState } from "react";
import { MUSIC_PLAYLIST_ID } from "./music-config";

export interface LibraryTrack {
  id: string;
  name: string;
  artist: string;
  cover: string;
  urlApi: string;
}

export interface PlaylistLibrary {
  name: string;
  total: number;
  tracks: LibraryTrack[];
}

function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function toTrack(value: unknown): LibraryTrack | null {
  if (!value || typeof value !== "object") return null;
  const track = value as Record<string, unknown>;
  const { id, title, author, pic, url } = track;
  if (typeof id !== "string" || typeof title !== "string" || typeof author !== "string") return null;
  if (typeof pic !== "string" || typeof url !== "string") return null;
  if (!/^\d{1,20}$/.test(id) || !isHttpsUrl(pic) || !isHttpsUrl(url)) return null;
  return { id, name: title, artist: author, cover: pic, urlApi: url };
}

let pending: Promise<PlaylistLibrary> | null = null;

/** One request per page load, shared by the poster, the fragments and the player. */
export function loadPlaylist(): Promise<PlaylistLibrary> {
  if (!pending) {
    pending = fetch(`/api/music/playlist?id=${MUSIC_PLAYLIST_ID}`)
      .then(async (response) => {
        if (!response.ok) throw new Error("获取歌单失败");
        const data: unknown = await response.json();
        if (!data || typeof data !== "object" || !("tracks" in data) || !Array.isArray(data.tracks)) {
          throw new Error("歌单格式无效");
        }
        const tracks = data.tracks.map(toTrack).filter((track): track is LibraryTrack => track !== null);
        if (tracks.length === 0) throw new Error("歌单为空");
        const name = "name" in data && typeof data.name === "string" ? data.name : "我喜欢的音乐";
        const total = "trackCount" in data && typeof data.trackCount === "number" ? data.trackCount : tracks.length;
        return { name, total, tracks };
      })
      .catch((error: unknown) => {
        pending = null;
        throw error;
      });
  }
  return pending;
}

export function usePlaylist(): PlaylistLibrary | null {
  const [library, setLibrary] = useState<PlaylistLibrary | null>(null);

  useEffect(() => {
    let active = true;
    loadPlaylist()
      .then((result) => {
        if (active) setLibrary(result);
      })
      .catch((error: unknown) => console.warn("歌单暂不可用:", error));
    return () => {
      active = false;
    };
  }, []);

  return library;
}
