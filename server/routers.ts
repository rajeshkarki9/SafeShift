import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  DEFAULT_EMPLOYEE_PASSWORD,
  DuplicateEmailError,
  clearLoginFailures,
  completeFirstLogin,
  createEmployeeAccount,
  findStaffAccount,
  isLoginLocked,
  listEmployeeAccounts,
  recordLoginFailure,
  resetEmployeePassword,
  verifyEmployeeCredentials,
} from "./accounts";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import {
  administratorProcedure,
  employeeProcedure,
  publicProcedure,
  router,
  staffProcedure,
} from "./_core/trpc";
import type { TrpcContext } from "./_core/context";
import {
  getEmployeeLearningRecord,
  getEmployeeLearningSummary,
  getEmployeeTopicOutcome,
  getQuizQuestions,
  listEmployeeLearningSummaries,
  listEmployeeTopicOutcomes,
  listEmployeeTopicOutcomesForEmployee,
  listQuizAttempts,
  saveEmployeeLearningOutcome,
  saveEmployeeReadiness,
  saveEmployeeTopicOutcome,
  saveQuizAttempt,
  updateEmployeeLearningStage,
} from "./db";
import { QUIZ_PASS_PERCENT } from "./quizCatalog";
import {
  SafeShiftSession,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  createSessionToken,
  isStrongPassword,
} from "./security";

const emailSchema = z.string().trim().toLowerCase().email().max(320);
const learningStageSchema = z.enum([
  "ready",
  "training",
  "quiz",
  "results",
  "progress",
]);
const passwordSchema = z.string().min(8).max(200).refine(isStrongPassword, {
  message:
    "Password must be at least 8 characters and include a letter and a number.",
});

async function setSessionCookie(
  ctx: Pick<TrpcContext, "req" | "res">,
  session: SafeShiftSession
) {
  const token = await createSessionToken(session);
  ctx.res.cookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: ctx.req.protocol === "https",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    session: publicProcedure.query(({ ctx }) => ctx.session),
    login: publicProcedure
      .input(
        z.object({ email: emailSchema, password: z.string().min(1).max(200) })
      )
      .mutation(async ({ input, ctx }) => {
        const email = input.email;
        if (isLoginLocked(email)) {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message:
              "Too many failed attempts. Please try again in a few minutes.",
          });
        }

        const staff = findStaffAccount(email, input.password);
        if (staff) {
          clearLoginFailures(email);
          const session: SafeShiftSession = {
            email: staff.email,
            role: staff.role,
            name: staff.name,
            mustChangePassword: false,
          };
          await setSessionCookie(ctx, session);
          return session;
        }

        const employee = await verifyEmployeeCredentials(email, input.password);
        if (!employee) {
          recordLoginFailure(email);
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Check email and password.",
          });
        }

        clearLoginFailures(email);
        const session: SafeShiftSession = {
          email: employee.email,
          role: "employee",
          name: employee.displayName,
          mustChangePassword: employee.mustChangePassword,
        };
        await setSessionCookie(ctx, session);
        return session;
      }),
    completeFirstLogin: employeeProcedure
      .input(
        z.object({
          newPassword: passwordSchema,
          displayName: z.string().trim().min(1).max(120),
          department: z.string().trim().max(120).optional(),
          phone: z.string().trim().max(40).optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!ctx.session.mustChangePassword) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "This account has already been set up.",
          });
        }
        const updated = await completeFirstLogin(ctx.session.email, {
          newPassword: input.newPassword,
          displayName: input.displayName,
          department: input.department ?? null,
          phone: input.phone ?? null,
        });
        // Keep the manager-facing learning record in sync with the real name.
        try {
          await saveEmployeeReadiness({
            employeeEmail: updated.email,
            displayName: updated.displayName,
          });
        } catch {
          // The readiness record is created lazily when training starts.
        }
        const session: SafeShiftSession = {
          email: updated.email,
          role: "employee",
          name: updated.displayName,
          mustChangePassword: false,
        };
        await setSessionCookie(ctx, session);
        return session;
      }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      ctx.res.clearCookie(SESSION_COOKIE_NAME, {
        httpOnly: true,
        path: "/",
        sameSite: "lax",
        secure: ctx.req.protocol === "https",
        maxAge: 0,
      });
      ctx.res.clearCookie("safeshift_demo_employee", {
        httpOnly: true,
        sameSite: "lax",
        secure: ctx.req.protocol === "https",
        maxAge: 0,
      });
      return { success: true } as const;
    }),
  }),
  employees: router({
    list: administratorProcedure.query(() => listEmployeeAccounts()),
    create: administratorProcedure
      .input(
        z.object({
          email: emailSchema,
          displayName: z.string().trim().max(120).optional(),
          password: z.string().min(8).max(200).optional(),
        })
      )
      .mutation(async ({ input }) => {
        try {
          return await createEmployeeAccount({
            email: input.email,
            displayName: input.displayName,
            password: input.password || DEFAULT_EMPLOYEE_PASSWORD,
          });
        } catch (error) {
          if (error instanceof DuplicateEmailError) {
            throw new TRPCError({ code: "CONFLICT", message: error.message });
          }
          throw error;
        }
      }),
    resetPassword: administratorProcedure
      .input(
        z.object({
          email: emailSchema,
          password: z.string().min(8).max(200).optional(),
        })
      )
      .mutation(({ input }) =>
        resetEmployeePassword(
          input.email,
          input.password || DEFAULT_EMPLOYEE_PASSWORD
        )
      ),
  }),
  learning: router({
    myRecord: employeeProcedure.query(
      async ({ ctx }) =>
        (await getEmployeeLearningRecord(ctx.session.email)) ?? null
    ),
    mySummary: employeeProcedure.query(
      async ({ ctx }) =>
        (await getEmployeeLearningSummary(ctx.session.email)) ?? null
    ),
    myTopic: employeeProcedure
      .input(z.object({ topicKey: z.string().trim().min(1).max(80) }))
      .query(
        async ({ input, ctx }) =>
          (await getEmployeeTopicOutcome(ctx.session.email, input.topicKey)) ??
          null
      ),
    myTopicRecords: employeeProcedure.query(({ ctx }) =>
      listEmployeeTopicOutcomesForEmployee(ctx.session.email)
    ),
    saveReadiness: employeeProcedure
      .input(z.object({ displayName: z.string().trim().min(1).max(120) }))
      .mutation(({ input, ctx }) =>
        saveEmployeeReadiness({
          employeeEmail: ctx.session.email,
          displayName: input.displayName,
        })
      ),
    updateStage: employeeProcedure
      .input(z.object({ learningStage: learningStageSchema }))
      .mutation(({ input, ctx }) =>
        updateEmployeeLearningStage(ctx.session.email, input.learningStage)
      ),
    saveOutcome: employeeProcedure
      .input(
        z.object({
          completionPercent: z.number().int().min(0).max(100),
          latestScore: z.number().int().min(0).max(100).nullable().optional(),
        })
      )
      .mutation(({ input, ctx }) =>
        saveEmployeeLearningOutcome({
          employeeEmail: ctx.session.email,
          completionPercent: input.completionPercent,
          latestScore: input.latestScore,
        })
      ),
    saveTopicOutcome: employeeProcedure
      .input(
        z.object({
          topicKey: z.string().trim().min(1).max(80),
          topicTitle: z.string().trim().min(1).max(160),
          learningStage: learningStageSchema,
          progressPercent: z.number().int().min(0).max(100),
          latestScore: z.number().int().min(0).max(100).nullable().optional(),
          vrScore: z.number().int().nullable().optional(),
        })
      )
      .mutation(({ input, ctx }) =>
        saveEmployeeTopicOutcome({ employeeEmail: ctx.session.email, ...input })
      ),
    quizQuestions: publicProcedure
      .input(z.object({ topicKey: z.string().trim().min(1).max(80) }))
      .query(({ input }) => getQuizQuestions(input.topicKey)),
    quizAttempts: employeeProcedure.query(({ ctx }) =>
      listQuizAttempts(ctx.session.email)
    ),
    saveQuizAttempt: employeeProcedure
      .input(
        z.object({
          topicKey: z.string().trim().min(1).max(80),
          topicTitle: z.string().trim().min(1).max(160),
          score: z.number().int().min(0).max(5),
          percentage: z.number().int().min(0).max(100),
          completionStatus: z.string().trim().min(1).max(40),
          answers: z
            .array(
              z.object({
                questionId: z.number().int(),
                selectedOption: z.number().int().min(0).max(3),
                isCorrect: z.boolean(),
              })
            )
            .length(5),
        })
      )
      .mutation(({ input, ctx }) => {
        const completionStatus =
          input.percentage >= QUIZ_PASS_PERCENT ? "Completed" : "Needs Review";
        return saveQuizAttempt({
          employeeEmail: ctx.session.email,
          ...input,
          completionStatus,
        });
      }),
    managerRecords: staffProcedure.query(() => listEmployeeLearningSummaries()),
    managerTopicRecords: staffProcedure.query(() =>
      listEmployeeTopicOutcomes()
    ),
  }),
});

export type AppRouter = typeof appRouter;
