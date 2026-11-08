import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { isOwner, ownerPassword } from "@/lib/moments-auth";
import { PAGE_SIZE, parseDraft, type MomentsPage } from "@/lib/moments";
import { getMomentsStore, toPublicMoment } from "@/lib/moments-store";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const store = getMomentsStore();
  const owner = isOwner(request);
  const enabled = Boolean(store && ownerPassword());
  if (!store) return NextResponse.json({ moments: [], owner, enabled, nextBefore: null } satisfies MomentsPage);

  const beforeParam = request.nextUrl.searchParams.get("before");
  const before = beforeParam && !Number.isNaN(Date.parse(beforeParam)) ? new Date(beforeParam).toISOString() : undefined;
  try {
    const records = await store.list(PAGE_SIZE + 1, before);
    const page = records.slice(0, PAGE_SIZE);
    const body: MomentsPage = {
      moments: page.map((record) => toPublicMoment(store, record)),
      owner,
      enabled,
      nextBefore: records.length > PAGE_SIZE ? page[page.length - 1].createdAt : null,
    };
    return NextResponse.json(body, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("读取朋友圈失败:", error);
    return NextResponse.json({ error: "暂时读不到动态" }, { status: 502 });
  }
}

export async function POST(request: NextRequest) {
  if (!isOwner(request)) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  const store = getMomentsStore();
  if (!store) return NextResponse.json({ error: "朋友圈还没有配置存储" }, { status: 503 });

  const parsed = parseDraft(await request.json().catch(() => null));
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const record = { id: randomUUID(), ...parsed.draft, likes: 0, createdAt: new Date().toISOString() };
  try {
    await store.create(record);
    return NextResponse.json(toPublicMoment(store, record), { status: 201 });
  } catch (error) {
    console.error("发布朋友圈失败:", error);
    return NextResponse.json({ error: "发布失败，请重试" }, { status: 502 });
  }
}
