export type PlaybackRequestResult =
  | { status: "playing" }
  | { status: "interrupted" }
  | { status: "failed"; error: unknown };

interface PlayableMedia {
  play: () => Promise<void>;
}

function isPlaybackInterruption(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    error.name === "AbortError"
  );
}

export async function requestMediaPlayback(
  media: PlayableMedia
): Promise<PlaybackRequestResult> {
  try {
    await media.play();
    return { status: "playing" };
  } catch (error: unknown) {
    if (isPlaybackInterruption(error)) {
      return { status: "interrupted" };
    }

    return { status: "failed", error };
  }
}
