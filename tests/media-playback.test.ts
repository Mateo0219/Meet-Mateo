import { describe, expect, it, vi } from "vitest";
import { requestMediaPlayback } from "../lib/media-playback";

describe("requestMediaPlayback", () => {
  it("treats a pause-interrupted play request as an expected interruption", async () => {
    const interruption = new DOMException(
      "The play() request was interrupted by a call to pause().",
      "AbortError"
    );
    const media = {
      play: vi.fn().mockRejectedValue(interruption),
    };

    await expect(requestMediaPlayback(media)).resolves.toEqual({
      status: "interrupted",
    });
  });

  it("preserves unexpected playback failures", async () => {
    const failure = new DOMException("Unsupported audio", "NotSupportedError");
    const media = {
      play: vi.fn().mockRejectedValue(failure),
    };

    await expect(requestMediaPlayback(media)).resolves.toEqual({
      status: "failed",
      error: failure,
    });
  });

  it("reports a successful play request", async () => {
    const media = {
      play: vi.fn().mockResolvedValue(undefined),
    };

    await expect(requestMediaPlayback(media)).resolves.toEqual({
      status: "playing",
    });
  });
});
