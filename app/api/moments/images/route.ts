import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { isOwner } from "@/lib/moments-auth";
import { MAX_IMAGE_BYTES, sniffImage } from "@/lib/moments";
import { getMomentsStore } from "@/lib/moments-store";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!isOwner(request)) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  const store = getMomentsStore();
  if (!store) return NextResponse.json({ error: "朋友圈还没有配置存储" }, { status: 503 });

  if (Number(request.headers.get("content-length")) > MAX_IMAGE_BYTES) return NextResponse.json({ error: "图片太大" }, { status: 413 });
  const bytes = new Uint8Array(await request.arrayBuffer());
  if (bytes.byteLength === 0 || bytes.byteLength > MAX_IMAGE_BYTES) return NextResponse.json({ error: "图片大小不对" }, { status: 413 });
  const type = sniffImage(bytes);
  if (!type) return NextResponse.json({ error: "只支持 JPG、PNG、WebP" }, { status: 415 });

  const name = `${randomUUID()}.${type.ext}`;
  try {
    await store.saveImage(name, bytes, type.mime);
    return NextResponse.json({ name, url: store.imageUrl(name) }, { status: 201 });
  } catch (error) {
    console.error("上传图片失败:", error);
    return NextResponse.json({ error: "上传失败，请重试" }, { status: 502 });
  }
}
