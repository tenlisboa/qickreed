import { describe, expect, it } from "vitest";
import {
  calculateComprehensionResult,
  calculateWpm,
  isPassingComprehension,
} from "../lib/utils";

describe("WPM Calculation", () => {
  it("calculates WPM correctly using num_words and reading_time_ms", () => {
    const numWords = 500;
    const readingTimeMs = 60000; // 1 minute
    expect(calculateWpm(numWords, readingTimeMs)).toBe(500);
  });

  it("calculates WPM with fractional result", () => {
    const numWords = 500;
    const readingTimeMs = 30000; // 30 seconds = 0.5 minutes
    expect(calculateWpm(numWords, readingTimeMs)).toBe(1000);
  });

  it("calculates WPM with 2-minute reading time", () => {
    const numWords = 300;
    const readingTimeMs = 120000; // 2 minutes
    expect(calculateWpm(numWords, readingTimeMs)).toBe(150);
  });

  it("handles zero reading time gracefully", () => {
    const numWords = 100;
    const readingTimeMs = 0;
    expect(calculateWpm(numWords, readingTimeMs)).toBe(0);
  });
});

describe("Comprehension Pass/Fail", () => {
  it("returns pass when comprehension >= 60%", () => {
    expect(isPassingComprehension(60)).toBe(true);
    expect(isPassingComprehension(75)).toBe(true);
    expect(isPassingComprehension(100)).toBe(true);
  });

  it("returns fail when comprehension < 60%", () => {
    expect(isPassingComprehension(59)).toBe(false);
    expect(isPassingComprehension(50)).toBe(false);
    expect(isPassingComprehension(0)).toBe(false);
  });

  it("calculates comprehension result with 10% reduction on fail", () => {
    const result = calculateComprehensionResult(50, 200);
    expect(result.passed).toBe(false);
    expect(result.newTargetWpm).toBe(180); // 200 * 0.9
  });

  it("keeps same target WPM on pass", () => {
    const result = calculateComprehensionResult(80, 200);
    expect(result.passed).toBe(true);
    expect(result.newTargetWpm).toBe(200);
  });

  it("handles exact 60% threshold as pass", () => {
    const result = calculateComprehensionResult(60, 150);
    expect(result.passed).toBe(true);
    expect(result.newTargetWpm).toBe(150);
  });

  it("handles just below 60% threshold as fail", () => {
    const result = calculateComprehensionResult(59.9, 150);
    expect(result.passed).toBe(false);
    expect(result.newTargetWpm).toBe(135); // 150 * 0.9
  });
});
