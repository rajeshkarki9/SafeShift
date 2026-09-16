import {
  serial,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["user", "admin"]);
export const learningStageEnum = pgEnum("learningStage", [
  "ready",
  "training",
  "quiz",
  "results",
  "progress",
]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const employeeAccounts = pgTable("employee_accounts", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  displayName: varchar("displayName", { length: 120 })
    .notNull()
    .default("Employee"),
  passwordHash: varchar("passwordHash", { length: 200 }).notNull(),
  mustChangePassword: integer("mustChangePassword").default(1).notNull(),
  department: varchar("department", { length: 120 }),
  phone: varchar("phone", { length: 40 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  lastSignedIn: timestamp("lastSignedIn"),
});

export type EmployeeAccount = typeof employeeAccounts.$inferSelect;
export type InsertEmployeeAccount = typeof employeeAccounts.$inferInsert;

export const employeeLearningRecords = pgTable("employee_learning_records", {
  id: serial("id").primaryKey(),
  employeeEmail: varchar("employeeEmail", { length: 320 }).notNull().unique(),
  displayName: varchar("displayName", { length: 120 }).notNull(),
  learningStage: learningStageEnum("learningStage").default("ready").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export type EmployeeLearningRecord =
  typeof employeeLearningRecords.$inferSelect;
export type InsertEmployeeLearningRecord =
  typeof employeeLearningRecords.$inferInsert;

export const employeeLearningOutcomes = pgTable("employee_learning_outcomes", {
  id: serial("id").primaryKey(),
  employeeEmail: varchar("employeeEmail", { length: 320 }).notNull().unique(),
  completionPercent: integer("completionPercent").default(0).notNull(),
  latestScore: integer("latestScore"),
  completedAt: timestamp("completedAt"),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export type EmployeeLearningOutcome =
  typeof employeeLearningOutcomes.$inferSelect;
export type InsertEmployeeLearningOutcome =
  typeof employeeLearningOutcomes.$inferInsert;

export const employeeTopicOutcomes = pgTable(
  "employee_topic_outcomes",
  {
    id: serial("id").primaryKey(),
    employeeEmail: varchar("employeeEmail", { length: 320 }).notNull(),
    topicKey: varchar("topicKey", { length: 80 }).notNull(),
    topicTitle: varchar("topicTitle", { length: 160 }).notNull(),
    learningStage: learningStageEnum("learningStage")
      .default("ready")
      .notNull(),
    progressPercent: integer("progressPercent").default(0).notNull(),
    latestScore: integer("latestScore"),
    vrScore: integer("vrScore"),
    completedAt: timestamp("completedAt"),
    updatedAt: timestamp("updatedAt")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  table => [
    unique("employee_topic_outcomes_employee_topic_unique").on(
      table.employeeEmail,
      table.topicKey
    ),
  ]
);

export type EmployeeTopicOutcome = typeof employeeTopicOutcomes.$inferSelect;
export type InsertEmployeeTopicOutcome =
  typeof employeeTopicOutcomes.$inferInsert;

export const quizQuestions = pgTable(
  "quiz_questions",
  {
    id: serial("id").primaryKey(),
    topicKey: varchar("topicKey", { length: 80 }).notNull(),
    topicTitle: varchar("topicTitle", { length: 160 }).notNull(),
    prompt: text("prompt").notNull(),
    optionsJson: text("optionsJson").notNull(),
    correctOption: integer("correctOption").notNull(),
    explanation: text("explanation").notNull(),
    sortOrder: integer("sortOrder").notNull(),
    active: integer("active").default(1).notNull(),
  },
  table => [
    unique("quiz_questions_topic_order_unique").on(
      table.topicKey,
      table.sortOrder
    ),
  ]
);

export type QuizQuestion = typeof quizQuestions.$inferSelect;
export type InsertQuizQuestion = typeof quizQuestions.$inferInsert;

export const quizAttempts = pgTable("quiz_attempts", {
  id: serial("id").primaryKey(),
  employeeEmail: varchar("employeeEmail", { length: 320 }).notNull(),
  topicKey: varchar("topicKey", { length: 80 }).notNull(),
  topicTitle: varchar("topicTitle", { length: 160 }).notNull(),
  score: integer("score").notNull(),
  percentage: integer("percentage").notNull(),
  correctAnswers: integer("correctAnswers").notNull(),
  incorrectAnswers: integer("incorrectAnswers").notNull(),
  completionStatus: varchar("completionStatus", { length: 40 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type QuizAttempt = typeof quizAttempts.$inferSelect;
export type InsertQuizAttempt = typeof quizAttempts.$inferInsert;

export const quizAttemptAnswers = pgTable("quiz_attempt_answers", {
  id: serial("id").primaryKey(),
  attemptId: integer("attemptId").notNull(),
  questionId: integer("questionId").notNull(),
  selectedOption: integer("selectedOption").notNull(),
  isCorrect: integer("isCorrect").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type QuizAttemptAnswer = typeof quizAttemptAnswers.$inferSelect;
export type InsertQuizAttemptAnswer = typeof quizAttemptAnswers.$inferInsert;
