import { NextRequest, NextResponse } from "next/server";
import { isValidResourceId } from "@/lib/music-security";

const NETEASE_LYRICS_URL = "https://music.163.com/api/song/lyric";
const MAX_LYRICS_BYTES = 512_000;

function extractLyrics(data: unknown): string | null {
  if (!data || typeof data !== "object" || !("lrc" in data)) {
    return null;
  }

  const lrc = data.lrc;
  if (!lrc || typeof lrc !== "object" || !("lyric" in lrc)) {
    return null;
  }

  return typeof lrc.lyric === "string" ? lrc.lyric : null;
}

export async function GET(request: NextRequest) {
  try {
    const songId = request.nextUrl.searchParams.get("id");
    if (!songId || !isValidResourceId(songId)) {
      return NextResponse.json({ error: "无效的歌曲 ID" }, { status: 400 });
    }

    const apiUrl = new URL(NETEASE_LYRICS_URL);
    apiUrl.search = new URLSearchParams({
      id: songId,
      lv: "1",
      kv: "1",
      tv: "-1",
    }).toString();

    const response = await fetch(apiUrl, {
      headers: {
        Referer: "https://music.163.com/",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      redirect: "error",
      signal: AbortSignal.timeout(8_000),
      next: { revalidate: 86_400 },
    });

    if (!response.ok) {
      throw new Error(`网易云歌词请求失败: ${response.status}`);
    }

    const contentLength = Number(response.headers.get("content-length") || 0);
    if (contentLength > MAX_LYRICS_BYTES) {
      throw new Error("歌词响应过大");
    }

    const body = await response.text();
    if (new TextEncoder().encode(body).byteLength > MAX_LYRICS_BYTES) {
      throw new Error("歌词响应过大");
    }

    const lyrics = extractLyrics(JSON.parse(body) as unknown);
    if (lyrics === null) {
      throw new Error("歌词响应格式无效");
    }

    return NextResponse.json(
      { lyrics },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=86400, stale-while-revalidate=604800",
        },
      }
    );
  } catch (error: unknown) {
    console.error("获取歌词错误:", error);
    return NextResponse.json({ error: "获取歌词失败" }, { status: 502 });
  }
}
