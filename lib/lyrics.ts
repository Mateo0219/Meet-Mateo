export interface LyricLine {
  time: number;
  text: string;
}

export function parseLyrics(lrcText: string): LyricLine[] {
  const lyrics: LyricLine[] = [];
  const timePattern = /\[(\d{1,3}):(\d{2})(?:[.:](\d{1,3}))?\]/g;
  const offsetMatch = lrcText.match(/\[offset:([+-]?\d+)\]/i);
  const offsetSeconds = offsetMatch ? Number(offsetMatch[1]) / 1_000 : 0;

  for (const line of lrcText.split(/\r?\n/)) {
    const matches = [...line.matchAll(timePattern)];
    const text = line.replace(timePattern, "").trim();

    if (matches.length === 0) {
      continue;
    }

    for (const match of matches) {
      const minutes = Number(match[1]);
      const seconds = Number(match[2]);
      const fraction = match[3]
        ? Number(match[3].padEnd(3, "0")) / 1_000
        : 0;

      lyrics.push({
        time: Math.max(0, minutes * 60 + seconds + fraction + offsetSeconds),
        text,
      });
    }
  }

  return lyrics.sort((a, b) => a.time - b.time);
}

export function findActiveLyricIndex(
  lyrics: LyricLine[],
  currentTime: number,
  leadSeconds = 0
): number {
  if (lyrics.length === 0 || !Number.isFinite(currentTime)) {
    return -1;
  }

  const targetTime = Math.max(0, currentTime + leadSeconds);
  let lowerBound = 0;
  let upperBound = lyrics.length - 1;
  let activeIndex = -1;

  while (lowerBound <= upperBound) {
    const middle = Math.floor((lowerBound + upperBound) / 2);
    if (lyrics[middle].time <= targetTime) {
      activeIndex = middle;
      lowerBound = middle + 1;
    } else {
      upperBound = middle - 1;
    }
  }

  return activeIndex;
}
