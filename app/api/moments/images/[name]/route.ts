import { NextRequest, NextResponse } from "next/server";
import { isImageName, sniffImage } from "@/lib/moments";
import { getMomentsStore } from "@/lib/moments-store";

// Only the local development store serves files itself; Supabase has public URLs.
export async function GET(_request: NextRequest, context: { params: Promise<{ name: string }> }) {
  const { name } = await context.params;
  const store = getMomentsStore();
  if (!isImageName(name) || !store?.readImage) return new NextResponse(null, { status: 404 });
  const bytes = await store.readImage(name);
  const type = bytes && sniffImage(bytes);
  if (!bytes || !type) return new NextResponse(null, { status: 404 });
  return new NextResponse(Buffer.from(bytes), {
    headers: { "Content-Type": type.mime, "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" },
  });
}
