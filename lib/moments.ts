/** Shared by the moments API and its client. No server-only imports here. */
export const MAX_IMAGES = 9;
export const MAX_TEXT = 1000;
export const MAX_LOCATION = 40;
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
export const PAGE_SIZE = 20;

export interface Moment {
  id: string;
  text: string;
  location: string | null;
  images: string[];
  likes: number;
  createdAt: string;
}

export interface MomentDraft {
  text: string;
  location: string | null;
  images: string[];
}

export interface MomentsPage {
  moments: Moment[];
  owner: boolean;
  enabled: boolean;
  nextBefore: string | null;
}

const IMAGE_NAME = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(webp|jpg|png)$/;
const MOMENT_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export const isImageName = (value: unknown): value is string => typeof value === "string" && IMAGE_NAME.test(value);
export const isMomentId = (value: unknown): value is string => typeof value === "string" && MOMENT_ID.test(value);

export function parseDraft(value: unknown): { ok: true; draft: MomentDraft } | { ok: false; error: string } {
  if (!value || typeof value !== "object") return { ok: false, error: "内容格式不对" };
  const { text, location, images } = value as Record<string, unknown>;
  if (typeof text !== "string") return { ok: false, error: "内容格式不对" };
  if (location !== undefined && location !== null && typeof location !== "string") return { ok: false, error: "地点格式不对" };
  if (!Array.isArray(images) || !images.every(isImageName)) return { ok: false, error: "图片格式不对" };
  const trimmed = text.trim();
  const place = location?.trim() || null;
  if (!trimmed && images.length === 0) return { ok: false, error: "写点什么或选张图" };
  if ([...trimmed].length > MAX_TEXT) return { ok: false, error: `最多 ${MAX_TEXT} 字` };
  if (place && [...place].length > MAX_LOCATION) return { ok: false, error: `地点最多 ${MAX_LOCATION} 字` };
  if (images.length > MAX_IMAGES) return { ok: false, error: `最多 ${MAX_IMAGES} 张图` };
  return { ok: true, draft: { text: trimmed, location: place, images: images as string[] } };
}

/** Trusts the file's bytes, never its claimed type or name. */
export function sniffImage(bytes: Uint8Array): { ext: "jpg" | "png" | "webp"; mime: string } | null {
  if (bytes.length >= 12) {
    if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return { ext: "jpg", mime: "image/jpeg" };
    if ([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((byte, index) => bytes[index] === byte)) return { ext: "png", mime: "image/png" };
    const ascii = (start: number, end: number) => String.fromCharCode(...bytes.slice(start, end));
    if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return { ext: "webp", mime: "image/webp" };
  }
  return null;
}

const beijingParts = (date: Date) => {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Shanghai", hourCycle: "h23", year: "numeric", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }).formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  return { year: Number(read("year")), month: Number(read("month")), day: Number(read("day")), time: `${read("hour").padStart(2, "0")}:${read("minute").padStart(2, "0")}` };
};

export function formatMomentTime(iso: string, now: Date): string {
  const date = new Date(iso);
  const elapsed = now.getTime() - date.getTime();
  if (elapsed < 60_000) return "刚刚";
  if (elapsed < 3_600_000) return `${Math.floor(elapsed / 60_000)} 分钟前`;
  const then = beijingParts(date), today = beijingParts(now);
  const sameDay = then.year === today.year && then.month === today.month && then.day === today.day;
  if (sameDay) return `${Math.floor(elapsed / 3_600_000)} 小时前`;
  const yesterday = beijingParts(new Date(now.getTime() - 86_400_000));
  if (then.year === yesterday.year && then.month === yesterday.month && then.day === yesterday.day) return `昨天 ${then.time}`;
  return then.year === today.year ? `${then.month}月${then.day}日` : `${then.year}年${then.month}月${then.day}日`;
}
