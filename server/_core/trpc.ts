import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from "@shared/const";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { SafeShiftRole } from "../security";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  })
);

/** Gate procedures on the SafeShift signed session held in the request cookie. */
function requireSessionRole(...roles: SafeShiftRole[]) {
  return t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.session || !roles.includes(ctx.session.role)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You do not have access to this action.",
      });
    }

    return next({
      ctx: {
        ...ctx,
        session: ctx.session,
      },
    });
  });
}

export const employeeProcedure = t.procedure.use(
  requireSessionRole("employee")
);
export const staffProcedure = t.procedure.use(
  requireSessionRole("manager", "administrator")
);
export const administratorProcedure = t.procedure.use(
  requireSessionRole("administrator")
);
