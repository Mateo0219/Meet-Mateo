import { describe, expect, it } from "vitest";
import { findActiveLyricIndex, parseLyrics } from "../lib/lyrics";

describe("parseLyrics", () => {
  it("parses and sorts common LRC timestamps", () => {
    const lyrics = parseLyrics(
      "[01:02.34]第二句\n[00:03]第一句\n[02:00:125]第三句"
    );

    expect(lyrics).toEqual([
      { time: 3, text: "第一句" },
      { time: 62.34, text: "第二句" },
      { time: 120.125, text: "第三句" },
    ]);
  });

  it("supports multiple timestamps and ignores metadata", () => {
    const lyrics = parseLyrics(
      "[ar:歌手]\n[00:01.00][00:05.00]重复歌词\n没有时间戳"
    );

    expect(lyrics).toEqual([
      { time: 1, text: "重复歌词" },
      { time: 5, text: "重复歌词" },
    ]);
  });

  it("preserves timed blank cues so instrumental gaps clear the active lyric", () => {
    const lyrics = parseLyrics(
      "[00:01.00]第一句\n[00:02.50]\n[00:04.00]第二句"
    );

    expect(lyrics).toEqual([
      { time: 1, text: "第一句" },
      { time: 2.5, text: "" },
      { time: 4, text: "第二句" },
    ]);
    expect(findActiveLyricIndex(lyrics, 2.8)).toBe(1);
  });

  it("applies LRC offset metadata to every timestamp", () => {
    expect(parseLyrics("[offset:-250]\n[00:01.00]校准后")).toEqual([
      { time: 0.75, text: "校准后" },
    ]);
  });

  it("can look slightly ahead to compensate for display latency", () => {
    const lyrics = parseLyrics("[00:01.00]第一句\n[00:02.00]第二句");

    expect(findActiveLyricIndex(lyrics, 1.88)).toBe(0);
    expect(findActiveLyricIndex(lyrics, 1.88, 0.15)).toBe(1);
  });
});
