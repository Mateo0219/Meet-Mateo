import { NextRequest, NextResponse } from "next/server";
import { clientKey, createRateLimiter } from "@/lib/moments-auth";
import { isMomentId } from "@/lib/moments";
import { getMomentsStore } from "@/lib/moments-store";

export const dynamic = "force-dynamic";

const allowLike = createRateLimiter(30, 60_000);

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const store = getMomentsStore();
  if (!store) return NextResponse.json({ error: "朋友圈还没有配置存储" }, { status: 503 });
  if (!isMomentId(id)) return NextResponse.json({ error: "无效的动态" }, { status: 400 });
  if (!allowLike(clientKey(request))) return NextResponse.json({ error: "点得太快了" }, { status: 429 });

  const body = (await request.json().catch(() => null)) as { delta?: unknown } | null;
  if (body?.delta !== 1 && body?.delta !== -1) return NextResponse.json({ error: "无效的操作" }, { status: 400 });
  try {
    const likes = await store.like(id, body.delta);
    if (likes === null) return NextResponse.json({ error: "这条动态不存在" }, { status: 404 });
    return NextResponse.json({ likes });
  } catch (error) {
    console.error("点赞失败:", error);
    return NextResponse.json({ error: "点赞失败" }, { status: 502 });
  }
}
