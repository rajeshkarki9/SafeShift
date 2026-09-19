import { asc, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import {
  employeeLearningOutcomes,
  employeeLearningRecords,
  employeeTopicOutcomes,
  InsertEmployeeLearningOutcome,
  InsertEmployeeLearningRecord,
  InsertEmployeeTopicOutcome,
  InsertUser,
  quizAttemptAnswers,
  quizAttempts,
  quizQuestions,
  users,
} from "../drizzle/schema";
import { quizCatalog } from "./quizCatalog";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;
let _pool: Pool | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _pool = new Pool({ connectionString: process.env.DATABASE_URL });
      _db = drizzle(_pool);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getEmployeeLearningRecord(employeeEmail: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(employeeLearningRecords)
    .where(eq(employeeLearningRecords.employeeEmail, employeeEmail))
    .limit(1);
  return result[0];
}

export async function saveEmployeeReadiness(
  input: Pick<InsertEmployeeLearningRecord, "employeeEmail" | "displayName">
) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const values: InsertEmployeeLearningRecord = {
    ...input,
    learningStage: "ready",
  };
  await db
    .insert(employeeLearningRecords)
    .values(values)
    .onConflictDoUpdate({
      target: employeeLearningRecords.employeeEmail,
      set: { displayName: input.displayName, updatedAt: new Date() },
    });
  return getEmployeeLearningRecord(input.employeeEmail);
}

export async function updateEmployeeLearningStage(
  employeeEmail: string,
  learningStage: InsertEmployeeLearningRecord["learningStage"]
) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  await db
    .update(employeeLearningRecords)
    .set({ learningStage, updatedAt: new Date() })
    .where(eq(employeeLearningRecords.employeeEmail, employeeEmail));
  return getEmployeeLearningRecord(employeeEmail);
}

export async function listEmployeeLearningRecords() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(employeeLearningRecords)
    .orderBy(desc(employeeLearningRecords.updatedAt));
}

export async function getEmployeeLearningSummary(employeeEmail: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select({
      id: employeeLearningRecords.id,
      employeeEmail: employeeLearningRecords.employeeEmail,
      displayName: employeeLearningRecords.displayName,
      learningStage: employeeLearningRecords.learningStage,
      completionPercent: employeeLearningOutcomes.completionPercent,
      latestScore: employeeLearningOutcomes.latestScore,
      completedAt: employeeLearningOutcomes.completedAt,
      updatedAt: employeeLearningRecords.updatedAt,
    })
    .from(employeeLearningRecords)
    .leftJoin(
      employeeLearningOutcomes,
      eq(
        employeeLearningRecords.employeeEmail,
        employeeLearningOutcomes.employeeEmail
      )
    )
    .where(eq(employeeLearningRecords.employeeEmail, employeeEmail))
    .limit(1);
  return result[0];
}

export async function saveEmployeeLearningOutcome(
  input: Pick<
    InsertEmployeeLearningOutcome,
    "employeeEmail" | "completionPercent" | "latestScore"
  >
) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const completionPercent = Math.max(
    0,
    Math.min(100, input.completionPercent ?? 0)
  );
  const values: InsertEmployeeLearningOutcome = {
    employeeEmail: input.employeeEmail,
    completionPercent,
    latestScore: input.latestScore,
    completedAt: completionPercent === 100 ? new Date() : null,
  };
  const updateSet: Record<string, unknown> = {
    completionPercent,
    completedAt: completionPercent === 100 ? new Date() : null,
    updatedAt: new Date(),
  };
  if (input.latestScore !== undefined)
    updateSet.latestScore = input.latestScore;
  await db.insert(employeeLearningOutcomes).values(values).onConflictDoUpdate({
    target: employeeLearningOutcomes.employeeEmail,
    set: updateSet,
  });
  return getEmployeeLearningSummary(input.employeeEmail);
}

export async function listEmployeeLearningSummaries() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: employeeLearningRecords.id,
      employeeEmail: employeeLearningRecords.employeeEmail,
      displayName: employeeLearningRecords.displayName,
      learningStage: employeeLearningRecords.learningStage,
      completionPercent: employeeLearningOutcomes.completionPercent,
      latestScore: employeeLearningOutcomes.latestScore,
      completedAt: employeeLearningOutcomes.completedAt,
      updatedAt: employeeLearningRecords.updatedAt,
    })
    .from(employeeLearningRecords)
    .leftJoin(
      employeeLearningOutcomes,
      eq(
        employeeLearningRecords.employeeEmail,
        employeeLearningOutcomes.employeeEmail
      )
    )
    .orderBy(desc(employeeLearningRecords.updatedAt));
}

export async function getEmployeeTopicOutcome(
  employeeEmail: string,
  topicKey: string
) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(employeeTopicOutcomes)
    .where(eq(employeeTopicOutcomes.employeeEmail, employeeEmail))
    .limit(10);
  return result.find(record => record.topicKey === topicKey);
}

export async function saveEmployeeTopicOutcome(
  input: Pick<
    InsertEmployeeTopicOutcome,
    | "employeeEmail"
    | "topicKey"
    | "topicTitle"
    | "learningStage"
    | "progressPercent"
    | "latestScore"
    | "vrScore"
  >
) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const progressPercent = Math.max(
    0,
    Math.min(100, input.progressPercent ?? 0)
  );
  const values: InsertEmployeeTopicOutcome = {
    ...input,
    progressPercent,
    completedAt: progressPercent === 100 ? new Date() : null,
  };
  const updateSet: Record<string, unknown> = {
    topicTitle: input.topicTitle,
    learningStage: input.learningStage,
    progressPercent,
    completedAt: progressPercent === 100 ? new Date() : null,
    updatedAt: new Date(),
  };
  if (input.latestScore !== undefined)
    updateSet.latestScore = input.latestScore;
  if (input.vrScore !== undefined) updateSet.vrScore = input.vrScore;
  await db
    .insert(employeeTopicOutcomes)
    .values(values)
    .onConflictDoUpdate({
      target: [
        employeeTopicOutcomes.employeeEmail,
        employeeTopicOutcomes.topicKey,
      ],
      set: updateSet,
    });
  return getEmployeeTopicOutcome(input.employeeEmail, input.topicKey);
}

export async function listEmployeeTopicOutcomes() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: employeeTopicOutcomes.id,
      employeeEmail: employeeLearningRecords.employeeEmail,
      displayName: employeeLearningRecords.displayName,
      topicKey: employeeTopicOutcomes.topicKey,
      topicTitle: employeeTopicOutcomes.topicTitle,
      learningStage: employeeTopicOutcomes.learningStage,
      progressPercent: employeeTopicOutcomes.progressPercent,
      latestScore: employeeTopicOutcomes.latestScore,
      vrScore: employeeTopicOutcomes.vrScore,
      completedAt: employeeTopicOutcomes.completedAt,
      updatedAt: employeeTopicOutcomes.updatedAt,
    })
    .from(employeeTopicOutcomes)
    .innerJoin(
      employeeLearningRecords,
      eq(
        employeeTopicOutcomes.employeeEmail,
        employeeLearningRecords.employeeEmail
      )
    )
    .orderBy(desc(employeeTopicOutcomes.updatedAt));
}

export async function listEmployeeTopicOutcomesForEmployee(
  employeeEmail: string
) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: employeeTopicOutcomes.id,
      employeeEmail: employeeLearningRecords.employeeEmail,
      displayName: employeeLearningRecords.displayName,
      topicKey: employeeTopicOutcomes.topicKey,
      topicTitle: employeeTopicOutcomes.topicTitle,
      learningStage: employeeTopicOutcomes.learningStage,
      progressPercent: employeeTopicOutcomes.progressPercent,
      latestScore: employeeTopicOutcomes.latestScore,
      vrScore: employeeTopicOutcomes.vrScore,
      completedAt: employeeTopicOutcomes.completedAt,
      updatedAt: employeeTopicOutcomes.updatedAt,
    })
    .from(employeeTopicOutcomes)
    .innerJoin(
      employeeLearningRecords,
      eq(
        employeeTopicOutcomes.employeeEmail,
        employeeLearningRecords.employeeEmail
      )
    )
    .where(eq(employeeTopicOutcomes.employeeEmail, employeeEmail))
    .orderBy(desc(employeeTopicOutcomes.updatedAt));
}

export async function getQuizQuestions(topicKey: string) {
  const db = await getDb();
  if (!db)
    return quizCatalog
      .filter(question => question.topicKey === topicKey)
      .map((question, index) => ({
        id: -(index + 1),
        topicKey: question.topicKey,
        topicTitle: question.topicTitle,
        prompt: question.prompt,
        optionsJson: JSON.stringify(question.options),
        correctOption: question.correctOption,
        explanation: question.explanation,
        sortOrder: index + 1,
        active: 1,
      }));
  let rows = await db
    .select()
    .from(quizQuestions)
    .where(eq(quizQuestions.topicKey, topicKey))
    .orderBy(asc(quizQuestions.sortOrder));
  if (!rows.length) {
    const seed = quizCatalog
      .filter(question => question.topicKey === topicKey)
      .map((question, index) => ({
        topicKey: question.topicKey,
        topicTitle: question.topicTitle,
        prompt: question.prompt,
        optionsJson: JSON.stringify(question.options),
        correctOption: question.correctOption,
        explanation: question.explanation,
        sortOrder: index + 1,
        active: 1,
      }));
    if (seed.length)
      await db
        .insert(quizQuestions)
        .values(seed)
        .onConflictDoUpdate({
          target: [quizQuestions.topicKey, quizQuestions.sortOrder],
          set: { topicTitle: seed[0].topicTitle },
        });
    rows = await db
      .select()
      .from(quizQuestions)
      .where(eq(quizQuestions.topicKey, topicKey))
      .orderBy(asc(quizQuestions.sortOrder));
  }
  return rows;
}

export async function saveQuizAttempt(input: {
  employeeEmail: string;
  topicKey: string;
  topicTitle: string;
  answers: Array<{
    questionId: number;
    selectedOption: number;
    isCorrect: boolean;
  }>;
  score: number;
  percentage: number;
  completionStatus: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const result = await db
    .insert(quizAttempts)
    .values({
      employeeEmail: input.employeeEmail,
      topicKey: input.topicKey,
      topicTitle: input.topicTitle,
      score: input.score,
      percentage: input.percentage,
      correctAnswers: input.score,
      incorrectAnswers: input.answers.length - input.score,
      completionStatus: input.completionStatus,
    })
    .returning({ id: quizAttempts.id });
  const attemptId = Number(result[0].id);
  if (input.answers.length)
    await db
      .insert(quizAttemptAnswers)
      .values(
        input.answers.map(answer => ({
          attemptId,
          questionId: answer.questionId,
          selectedOption: answer.selectedOption,
          isCorrect: answer.isCorrect ? 1 : 0,
        }))
      );
  return {
    id: attemptId,
    ...input,
    incorrectAnswers: input.answers.length - input.score,
  };
}

export async function listQuizAttempts(employeeEmail: string) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(quizAttempts)
    .where(eq(quizAttempts.employeeEmail, employeeEmail))
    .orderBy(desc(quizAttempts.createdAt));
}
