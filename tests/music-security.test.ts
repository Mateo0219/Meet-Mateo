import { describe, expect, it } from "vitest";
import { isValidResourceId } from "../lib/music-security";

describe("music resource security", () => {
  it("accepts numeric playlist and song ids", () => {
    expect(isValidResourceId("13049743731")).toBe(true);
    expect(isValidResourceId("1")).toBe(true);
  });

  it.each([
    "1&server=other",
    "-1",
    "1".repeat(21),
    "https://127.0.0.1/metadata",
    "localhost",
    "",
  ])("rejects unsafe resource id %s", (value) => {
    expect(isValidResourceId(value)).toBe(false);
  });
});
