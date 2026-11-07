export interface PlaylistTrack {
  id: string;
  title: string;
  author: string;
  pic: string;
  url: string;
}

interface NeteaseArtist {
  name?: unknown;
}

interface NeteaseTrack {
  id?: unknown;
  name?: unknown;
  artists?: unknown;
  ar?: unknown;
  al?: { picUrl?: unknown };
  album?: {
    picUrl?: unknown;
  };
}

function asHttpsUrl(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  try {
    const url = new URL(value.replace(/^http:\/\//, "https://"));
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export function normalizeNeteasePlaylist(data: unknown): PlaylistTrack[] {
  if (!data || typeof data !== "object") {
    return [];
  }

  const body = data as Record<string, unknown>;
  const playlist = (body.playlist ?? body.result) as { tracks?: unknown } | undefined;
  const songs = body.songs ?? playlist?.tracks;
  if (!Array.isArray(songs)) return [];

  return songs.flatMap((value) => {
    if (!value || typeof value !== "object") {
      return [];
    }

    const track = value as NeteaseTrack;
    const id =
      typeof track.id === "number" && Number.isSafeInteger(track.id) && track.id > 0
        ? String(track.id)
        : null;
    const title = typeof track.name === "string" ? track.name.trim() : "";
    const pic = asHttpsUrl(track.al?.picUrl ?? track.album?.picUrl);
    const artistData = track.ar ?? track.artists;
    const artists = Array.isArray(artistData)
      ? (artistData as NeteaseArtist[])
          .map((artist) =>
            typeof artist?.name === "string" ? artist.name.trim() : ""
          )
          .filter(Boolean)
      : [];

    if (!id || !title || !pic || artists.length === 0) {
      return [];
    }

    const playbackUrl = new URL("https://music.163.com/song/media/outer/url");
    playbackUrl.searchParams.set("id", `${id}.mp3`);

    return [
      {
        id,
        title,
        author: artists.join(" / "),
        pic,
        url: playbackUrl.toString(),
      },
    ];
  });
}
