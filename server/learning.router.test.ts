import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";
import type { SafeShiftSession } from "./security";

const dbMocks = vi.hoisted(() => ({
  getDb: vi.fn(),
  upsertUser: vi.fn(),
  getUserByOpenId: vi.fn(),
  getEmployeeLearningRecord: vi.fn(),
  getEmployeeLearningSummary: vi.fn(),
  getEmployeeTopicOutcome: vi.fn(),
  listEmployeeLearningSummaries: vi.fn(),
  listEmployeeTopicOutcomes: vi.fn(),
  listEmployeeTopicOutcomesForEmployee: vi.fn(),
  listQuizAttempts: vi.fn(),
  saveEmployeeLearningOutcome: vi.fn(),
  saveEmployeeReadiness: vi.fn(),
  saveEmployeeTopicOutcome: vi.fn(),
  saveQuizAttempt: vi.fn(),
  updateEmployeeLearningStage: vi.fn(),
  getQuizQuestions: vi.fn(),
}));

vi.mock("./db", () => dbMocks);

import { appRouter } from "./routers";

function createContext(session: SafeShiftSession | null): TrpcContext {
  return {
    user: null,
    session,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
      cookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

const employeeSession: SafeShiftSession = {
  email: "avery@employee.com",
  role: "employee",
  name: "Avery Patel",
  mustChangePassword: false,
};
const managerSession: SafeShiftSession = {
  email: "manager@safeshift.com",
  role: "manager",
  name: "Manager",
  mustChangePassword: false,
};

describe("learning router", () => {
  beforeEach(() => vi.clearAllMocks());

  it("saves readiness against the session email, never a client-supplied email", async () => {
    const saved = {
      id: 1,
      employeeEmail: "avery@employee.com",
      displayName: "Avery Patel",
      learningStage: "ready",
    };
    dbMocks.saveEmployeeReadiness.mockResolvedValue(saved);
    const caller = appRouter.createCaller(createContext(employeeSession));

    await expect(
      caller.learning.saveReadiness({ displayName: "Avery Patel" })
    ).resolves.toEqual(saved);
    expect(dbMocks.saveEmployeeReadiness).toHaveBeenCalledWith({
      employeeEmail: "avery@employee.com",
      displayName: "Avery Patel",
    });
  });

  it("saves topic outcomes under the session identity and exposes them to the Manager view", async () => {
    const saved = {
      id: 1,
      employeeEmail: "avery@employee.com",
      displayName: "Avery Patel",
      topicKey: "safe-choices",
      topicTitle: "Safe choices",
      learningStage: "progress",
      progressPercent: 100,
      latestScore: 100,
      completedAt: new Date(),
      updatedAt: new Date(),
    };
    dbMocks.saveEmployeeTopicOutcome.mockResolvedValue(saved);
    dbMocks.listEmployeeTopicOutcomes.mockResolvedValue([saved]);
    const employee = appRouter.createCaller(createContext(employeeSession));
    const manager = appRouter.createCaller(createContext(managerSession));

    await expect(
      employee.learning.saveTopicOutcome({
        topicKey: "safe-choices",
        topicTitle: "Safe choices",
        learningStage: "progress",
        progressPercent: 100,
        latestScore: 100,
      })
    ).resolves.toEqual(saved);
    expect(dbMocks.saveEmployeeTopicOutcome).toHaveBeenCalledWith(
      expect.objectContaining({ employeeEmail: "avery@employee.com" })
    );
    await expect(manager.learning.managerTopicRecords()).resolves.toEqual([
      saved,
    ]);
  });

  it("scopes quiz attempts to the signed-in employee", async () => {
    dbMocks.listQuizAttempts.mockResolvedValue([]);
    const caller = appRouter.createCaller(createContext(employeeSession));

    await caller.learning.quizAttempts();
    expect(dbMocks.listQuizAttempts).toHaveBeenCalledWith("avery@employee.com");
  });

  it("rejects employee-only procedures for anonymous and manager sessions", async () => {
    const anonymous = appRouter.createCaller(createContext(null));
    const manager = appRouter.createCaller(createContext(managerSession));

    await expect(anonymous.learning.myTopicRecords()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(manager.learning.quizAttempts()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("rejects manager reports for employees", async () => {
    const employee = appRouter.createCaller(createContext(employeeSession));
    await expect(employee.learning.managerTopicRecords()).rejects.toMatchObject(
      { code: "FORBIDDEN" }
    );
  });
});
