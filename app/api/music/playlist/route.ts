import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { isValidResourceId } from "@/lib/music-security";
import { MUSIC_CACHE_SECONDS, MUSIC_PLAYLIST_ID } from "@/lib/music-config";
import { fetchNeteasePlaylist } from "@/lib/netease-playlist";

// Revalidate the complete snapshot; failed refreshes retain the last success.
const getPlaylist = unstable_cache(
  (id: string) => fetchNeteasePlaylist(id),
  ["netease-playlist-v6"],
  { revalidate: MUSIC_CACHE_SECONDS },
);

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id") || MUSIC_PLAYLIST_ID;
  if (!isValidResourceId(id)) {
    return NextResponse.json({ error: "无效的歌单 ID" }, { status: 400 });
  }
  try {
    return NextResponse.json(await getPlaylist(id), {
      headers: { "Cache-Control": "no-cache" },
    });
  } catch (error: unknown) {
    console.error("获取歌单错误:", error);
    return NextResponse.json({ error: "暂时无法读取网易云歌单，请稍后重试" }, { status: 502 });
  }
}
