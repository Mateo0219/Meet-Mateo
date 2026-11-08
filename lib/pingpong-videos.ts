/**
 * Clips shown under「我的球」. Upload to Bilibili, then add one entry here:
 * { id: "first-match", title: "第一场比赛", date: "2026-11", bvid: "BV1xxxxxxxxx" }
 */
export interface PingPongVideo {
  id: string;
  title: string;
  date?: string;
  bvid: string;
}

export const pingpongVideos: PingPongVideo[] = [];

export const isValidBvid = (bvid: string) => /^BV[0-9A-Za-z]{10}$/.test(bvid);

export const bilibiliPlayerUrl = (bvid: string) => `https://player.bilibili.com/player.html?bvid=${encodeURIComponent(bvid)}&autoplay=1&high_quality=1`;
