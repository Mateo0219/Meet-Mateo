import { describe, expect, it } from "vitest";
import { composePoster, posterLayouts, swatches } from "../lib/poster";
import { createRandom } from "../lib/random";
import { describeHour, readBeijingClock } from "../lib/signals";
import {
  applyTemperature,
  greedySentence,
  heroSentence,
  sampleIndex,
  sampleSentence,
  sentenceText,
} from "../lib/token-sentence";

describe("createRandom", () => {
  it("repeats the same sequence for the same seed", () => {
    const a = createRandom(42);
    const b = createRandom(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it("stays within [0, 1)", () => {
    const random = createRandom(7);
    for (let index = 0; index < 500; index += 1) {
      const value = random();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});

describe("Beijing clock", () => {
  it("names the hour the way people say it", () => {
    expect(describeHour(0)).toBe("午夜");
    expect(describeHour(1)).toBe("凌晨一点");
    expect(describeHour(2)).toBe("凌晨两点");
    expect(describeHour(12)).toBe("中午十二点");
    expect(describeHour(15)).toBe("下午三点");
    expect(describeHour(18)).toBe("傍晚六点");
    expect(describeHour(21)).toBe("晚上九点");
    expect(describeHour(23)).toBe("深夜十一点");
  });

  it("reads time in Asia/Shanghai regardless of the host time zone", () => {
    const clock = readBeijingClock(new Date("2026-10-14T17:10:00Z"));
    expect(clock.time).toBe("01:10");
    expect(clock.weekday).toBe("周四");
    expect(clock.moment).toBe("凌晨一点");
    expect(clock.isNight).toBe(true);
  });

  it("treats Beijing midnight as hour 0, not 24", () => {
    const clock = readBeijingClock(new Date("2026-10-14T16:05:00Z"));
    expect(clock.hour).toBe(0);
    expect(clock.time).toBe("00:05");
  });
});

describe("composePoster", () => {
  it("is deterministic for a seed", () => {
    expect(composePoster(4821, false)).toEqual(composePoster(4821, false));
  });

  it("uses known layouts and swatches", () => {
    for (let seed = 1; seed < 200; seed += 1) {
      const poster = composePoster(seed, seed % 2 === 0);
      expect(posterLayouts).toContain(poster.layout);
      for (const name of Object.values(poster.colors)) expect(swatches).toHaveProperty(name);
      expect(poster.chipColors.length).toBeGreaterThan(0);
      expect(poster.chipColors).not.toContain("night");
    }
  });

  it("never paints two neighbouring blocks the same colour", () => {
    for (let seed = 1; seed < 200; seed += 1) {
      const colors = Object.values(composePoster(seed, seed % 3 === 0).colors);
      expect(new Set(colors).size).toBe(colors.length);
    }
  });
});

describe("token sentence", () => {
  it("sharpens toward the top choice at low temperature and flattens at high", () => {
    const weights = [0.5, 0.3, 0.2];
    const cold = applyTemperature(weights, 0.1);
    const hot = applyTemperature(weights, 2);
    expect(cold[0]).toBeGreaterThan(0.99);
    expect(hot[0]).toBeLessThan(0.5);
    expect(cold.reduce((sum, value) => sum + value, 0)).toBeCloseTo(1);
    expect(hot.reduce((sum, value) => sum + value, 0)).toBeCloseTo(1);
  });

  it("returns the identity distribution at temperature 1", () => {
    expect(applyTemperature([0.5, 0.3, 0.2], 1)).toEqual([0.5, 0.3, 0.2].map((value) => expect.closeTo(value, 6)));
  });

  it("samples by cumulative probability", () => {
    expect(sampleIndex([0.2, 0.5, 0.3], () => 0.1)).toBe(0);
    expect(sampleIndex([0.2, 0.5, 0.3], () => 0.6)).toBe(1);
    expect(sampleIndex([0.2, 0.5, 0.3], () => 0.95)).toBe(2);
  });

  it("produces the most likely sentence when greedy", () => {
    expect(sentenceText(greedySentence())).toBe("我在北京vibe coding，也做界面。喜欢把模糊的念头变成能用的东西。");
  });

  it("only picks valid candidates for every slot", () => {
    const random = createRandom(99);
    for (let round = 0; round < 50; round += 1) {
      const choice = sampleSentence(random, 1.5);
      for (const part of heroSentence) {
        if (typeof part === "string") continue;
        expect(choice[part.id]).toBeGreaterThanOrEqual(0);
        expect(choice[part.id]).toBeLessThan(part.candidates.length);
      }
    }
  });
});
