import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calculateWpm(numWords: number, readingTimeMs: number): number {
  if (readingTimeMs <= 0) return 0;
  return (numWords / readingTimeMs) * 60000;
}

export function isPassingComprehension(score: number): boolean {
  return score >= 60;
}

export interface ComprehensionResult {
  passed: boolean;
  newTargetWpm: number;
}

export function calculateComprehensionResult(
  score: number,
  currentTargetWpm: number,
): ComprehensionResult {
  const passed = isPassingComprehension(score);
  return {
    passed,
    newTargetWpm: passed
      ? currentTargetWpm
      : Math.round(currentTargetWpm * 0.9),
  };
}
