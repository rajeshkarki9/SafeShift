import { describe, expect, it } from "vitest";
import { scoreQuiz } from "./scoring";

describe("scoreQuiz", () => {
  const questions = [
    { id: 1, correctOption: 1 },
    { id: 2, correctOption: 0 },
    { id: 3, correctOption: 2 },
  ];

  it("counts correct answers and calculates a rounded percentage", () => {
    expect(scoreQuiz(questions, { 1: 1, 2: 3, 3: 2 })).toEqual({
      correct: 2,
      total: 3,
      percentage: 67,
    });
  });

  it("returns zero when no questions are available", () => {
    expect(scoreQuiz([], {})).toEqual({ correct: 0, total: 0, percentage: 0 });
  });

  it("does not award credit for unanswered questions", () => {
    expect(scoreQuiz(questions, { 1: 1 })).toEqual({
      correct: 1,
      total: 3,
      percentage: 33,
    });
  });
});
