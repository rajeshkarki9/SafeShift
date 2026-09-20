import { describe, expect, it } from "vitest";
import {
  quizCatalog,
  QUIZ_QUESTION_COUNT,
  QUIZ_PASS_PERCENT,
} from "./quizCatalog";

describe("SafeShift quiz catalog", () => {
  it("contains exactly five questions for each of six topics", () => {
    expect(quizCatalog).toHaveLength(30);
    const counts = quizCatalog.reduce<Record<string, number>>(
      (result, question) => {
        result[question.topicKey] = (result[question.topicKey] || 0) + 1;
        return result;
      },
      {}
    );
    expect(Object.keys(counts)).toHaveLength(6);
    Object.values(counts).forEach(count =>
      expect(count).toBe(QUIZ_QUESTION_COUNT)
    );
  });

  it("exposes the configurable 80 percent completion threshold", () => {
    expect(QUIZ_PASS_PERCENT).toBe(80);
  });
});
