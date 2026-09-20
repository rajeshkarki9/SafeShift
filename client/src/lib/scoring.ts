export type AnswerKey = Record<number, number>;

export function scoreQuiz(
  questions: Array<{ id: number; correctOption: number }>,
  answers: AnswerKey
) {
  const correct = questions.reduce(
    (total, question) =>
      total + (answers[question.id] === question.correctOption ? 1 : 0),
    0
  );
  const total = questions.length;
  return {
    correct,
    total,
    percentage: total ? Math.round((correct / total) * 100) : 0,
  };
}

export const PASS_MARK: number | null = null;
