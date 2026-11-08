import { promises as fs } from "node:fs";
import path from "node:path";
import { isImageName, type Moment } from "./moments";

/** A moment as stored: `images` holds file names, not URLs. */
export type MomentRecord = Moment;

export interface MomentsStore {
  kind: "local" | "supabase";
  list(limit: number, before?: string): Promise<MomentRecord[]>;
  create(record: MomentRecord): Promise<void>;
  remove(id: string): Promise<MomentRecord | null>;
  like(id: string, delta: 1 | -1): Promise<number | null>;
  saveImage(name: string, bytes: Uint8Array, mime: string): Promise<void>;
  deleteImages(names: string[]): Promise<void>;
  imageUrl(name: string): string;
  readImage?(name: string): Promise<Uint8Array | null>;
}

/** Development only: keeps everything in .data/moments so posting works without an account. */
export function createLocalStore(directory: string): MomentsStore {
  const file = path.join(directory, "moments.json");
  const images = path.join(directory, "images");
  let queue: Promise<unknown> = Promise.resolve();

  const read = async (): Promise<MomentRecord[]> => {
    try {
      return JSON.parse(await fs.readFile(file, "utf8")) as MomentRecord[];
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
      throw error;
    }
  };
  const update = <T>(change: (records: MomentRecord[]) => { records: MomentRecord[]; result: T }): Promise<T> => {
    const run = queue.then(async () => {
      const { records, result } = change(await read());
      await fs.mkdir(directory, { recursive: true });
      await fs.writeFile(file, JSON.stringify(records, null, 2));
      return result;
    });
    queue = run.catch(() => undefined);
    return run;
  };

  return {
    kind: "local",
    async list(limit, before) {
      const records = (await read()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      return (before ? records.filter((record) => record.createdAt < before) : records).slice(0, limit);
    },
    create: (record) => update((records) => ({ records: [record, ...records], result: undefined })),
    remove: (id) => update((records) => ({ records: records.filter((record) => record.id !== id), result: records.find((record) => record.id === id) ?? null })),
    like: (id, delta) => update((records) => {
      const target = records.find((record) => record.id === id);
      if (target) target.likes = Math.max(0, target.likes + delta);
      return { records, result: target ? target.likes : null };
    }),
    async saveImage(name, bytes) {
      await fs.mkdir(images, { recursive: true });
      await fs.writeFile(path.join(images, name), bytes);
    },
    async deleteImages(names) {
      await Promise.all(names.filter(isImageName).map((name) => fs.rm(path.join(images, name), { force: true })));
    },
    imageUrl: (name) => `/api/moments/images/${name}`,
    async readImage(name) {
      if (!isImageName(name)) return null;
      try {
        return await fs.readFile(path.join(images, name));
      } catch {
        return null;
      }
    },
  };
}

interface Row { id: string; text: string; location: string | null; images: string[]; likes: number; created_at: string }
const fromRow = (row: Row): MomentRecord => ({ id: row.id, text: row.text, location: row.location, images: row.images, likes: row.likes, createdAt: row.created_at });

/** Talks to Supabase over REST with the service key, which never leaves the server. Schema: supabase/schema.sql */
export function createSupabaseStore(baseUrl: string, serviceKey: string, fetcher: typeof fetch = fetch): MomentsStore {
  const base = baseUrl.replace(/\/+$/, "");
  const request = async (route: string, init: RequestInit = {}) => {
    const response = await fetcher(`${base}${route}`, {
      ...init,
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, ...init.headers },
      redirect: "error",
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) throw new Error(`Supabase 请求失败: ${response.status}`);
    return response;
  };
  const json = { "Content-Type": "application/json" };

  return {
    kind: "supabase",
    async list(limit, before) {
      const query = new URLSearchParams({ select: "*", order: "created_at.desc", limit: String(limit) });
      if (before) query.set("created_at", `lt.${before}`);
      return ((await (await request(`/rest/v1/moments?${query}`)).json()) as Row[]).map(fromRow);
    },
    async create(record) {
      await request("/rest/v1/moments", { method: "POST", headers: json, body: JSON.stringify({ id: record.id, text: record.text, location: record.location, images: record.images, likes: record.likes, created_at: record.createdAt }) });
    },
    async remove(id) {
      const rows = (await (await request(`/rest/v1/moments?id=eq.${encodeURIComponent(id)}`, { method: "DELETE", headers: { Prefer: "return=representation" } })).json()) as Row[];
      return rows[0] ? fromRow(rows[0]) : null;
    },
    async like(id, delta) {
      const result: unknown = await (await request("/rest/v1/rpc/adjust_moment_likes", { method: "POST", headers: json, body: JSON.stringify({ target_id: id, delta }) })).json();
      return typeof result === "number" ? result : null;
    },
    async saveImage(name, bytes, mime) {
      await request(`/storage/v1/object/moments/${name}`, { method: "POST", headers: { "Content-Type": mime }, body: Buffer.from(bytes) });
    },
    async deleteImages(names) {
      if (names.length) await request("/storage/v1/object/moments", { method: "DELETE", headers: json, body: JSON.stringify({ prefixes: names.filter(isImageName) }) });
    },
    imageUrl: (name) => `${base}/storage/v1/object/public/moments/${name}`,
  };
}

let local: MomentsStore | null = null;

/** Null means posting isn't set up: production without Supabase has no durable place to write. */
export function getMomentsStore(env: Record<string, string | undefined> = process.env): MomentsStore | null {
  const { SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: key } = env;
  if (url?.startsWith("https://") && key) return createSupabaseStore(url, key);
  if (env.NODE_ENV === "production") return null;
  local ??= createLocalStore(path.join(process.cwd(), ".data", "moments"));
  return local;
}

export const toPublicMoment = (store: MomentsStore, record: MomentRecord): Moment => ({ ...record, images: record.images.map((name) => store.imageUrl(name)) });
