import type { DimensionKey } from "@/types/evaluation";

/**
 * Editorial dimensions and their published weights.
 * Used for labels and the methodology explanation only — the final score is
 * always taken from the backend response, never recomputed here.
 */
export const EDITORIAL_DIMENSIONS: {
  key: DimensionKey;
  label: string;
  weight: number;
  description: string;
}[] = [
  {
    key: "hook_strength",
    label: "Hook Strength",
    weight: 0.25,
    description: "How quickly the opening grabs attention.",
  },
  {
    key: "emotional_intensity",
    label: "Emotional Intensity",
    weight: 0.2,
    description: "Strength of the emotional beat.",
  },
  {
    key: "curiosity_gap",
    label: "Curiosity Gap",
    weight: 0.2,
    description: "How much the viewer wants to know what happens next.",
  },
  {
    key: "standalone_readability",
    label: "Standalone Readability",
    weight: 0.2,
    description: "Whether a new viewer can follow it without context.",
  },
  {
    key: "spoiler_safety",
    label: "Spoiler Safety",
    weight: 0.15,
    description: "How little it gives away of major twists.",
  },
];

export function formatWeight(weight: number) {
  return `${Math.round(weight * 100)}%`;
}
