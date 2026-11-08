/**
 * The hero sentence is "sampled" like model output, but from a hand-written
 * distribution. The UI labels it as preset; there is no live model here.
 */

export interface TokenCandidate {
  text: string;
  weight: number;
}

export interface TokenSlot {
  id: string;
  candidates: TokenCandidate[];
}

export type SentencePart = string | TokenSlot;

const slot = (id: string, candidates: [string, number][]): TokenSlot => ({
  id,
  candidates: candidates.map(([text, weight]) => ({ text, weight })),
});

export const heroSentence: SentencePart[] = [
  "我",
  "在",
  "北京",
  slot("doing", [["vibe coding", 0.42], ["做东西", 0.27], ["听歌", 0.19], ["发呆", 0.12]]),
  "，",
  "也",
  slot("also", [["做界面", 0.5], ["收集歌单", 0.3], ["打乒乓", 0.2]]),
  "。",
  "喜欢",
  "把",
  slot("object", [["模糊的念头", 0.5], ["一首歌的情绪", 0.28], ["一次发球", 0.22]]),
  "变成",
  slot("result", [["能用的东西", 0.52], ["界面", 0.3], ["下一次尝试", 0.18]]),
  "。",
];

export type SentenceChoice = Record<string, number>;

/** Softmax-style temperature over plain weights: p_i ∝ w_i^(1/T). */
export function applyTemperature(weights: readonly number[], temperature: number): number[] {
  const t = Math.min(Math.max(temperature, 0.05), 2);
  const scaled = weights.map((weight) => Math.pow(Math.max(weight, 1e-6), 1 / t));
  const total = scaled.reduce((sum, value) => sum + value, 0);
  return scaled.map((value) => value / total);
}

export function sampleIndex(probabilities: readonly number[], random: () => number): number {
  let threshold = random();
  for (let index = 0; index < probabilities.length; index += 1) {
    threshold -= probabilities[index];
    if (threshold <= 0) return index;
  }
  return probabilities.length - 1;
}

export function sampleSentence(random: () => number, temperature: number): SentenceChoice {
  const choice: SentenceChoice = {};
  for (const part of heroSentence) {
    if (typeof part === "string") continue;
    const probabilities = applyTemperature(part.candidates.map((candidate) => candidate.weight), temperature);
    choice[part.id] = sampleIndex(probabilities, random);
  }
  return choice;
}

export function greedySentence(): SentenceChoice {
  const choice: SentenceChoice = {};
  for (const part of heroSentence) {
    if (typeof part === "string") continue;
    const weights = part.candidates.map((candidate) => candidate.weight);
    choice[part.id] = weights.indexOf(Math.max(...weights));
  }
  return choice;
}

export function sentenceText(choice: SentenceChoice): string {
  return heroSentence
    .map((part) => (typeof part === "string" ? part : part.candidates[choice[part.id] ?? 0].text))
    .join("");
}
