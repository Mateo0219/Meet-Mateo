import { NextRequest, NextResponse } from "next/server";
import { isOwner } from "@/lib/moments-auth";
import { isMomentId } from "@/lib/moments";
import { getMomentsStore } from "@/lib/moments-store";

export const dynamic = "force-dynamic";

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!isOwner(request)) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  const { id } = await context.params;
  const store = getMomentsStore();
  if (!store) return NextResponse.json({ error: "朋友圈还没有配置存储" }, { status: 503 });
  if (!isMomentId(id)) return NextResponse.json({ error: "无效的动态" }, { status: 400 });
  try {
    const removed = await store.remove(id);
    if (!removed) return NextResponse.json({ error: "这条动态不存在" }, { status: 404 });
    // The post is already gone; a leftover file must not report the delete as failed.
    await store.deleteImages(removed.images).catch((error) => console.error("清理图片失败:", error));
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("删除朋友圈失败:", error);
    return NextResponse.json({ error: "删除失败，请重试" }, { status: 502 });
  }
}
