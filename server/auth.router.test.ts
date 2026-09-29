import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";
import { SESSION_COOKIE_NAME, SafeShiftSession } from "./security";
import { DEFAULT_EMPLOYEE_PASSWORD, __resetAccountsForTests } from "./accounts";
import { appRouter } from "./routers";

type CookieCall = { name: string; value: string };

function createContext(session: SafeShiftSession | null): {
  ctx: TrpcContext;
  cookies: CookieCall[];
} {
  const cookies: CookieCall[] = [];
  const ctx: TrpcContext = {
    user: null,
    session,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      cookie: (name: string, value: string) => cookies.push({ name, value }),
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
  return { ctx, cookies };
}

const adminSession: SafeShiftSession = {
  email: "admin@safeshift.com",
  role: "administrator",
  name: "Administrator",
  mustChangePassword: false,
};

describe("auth router", () => {
  beforeEach(() => {
    __resetAccountsForTests();
    vi.clearAllMocks();
  });

  it("signs in a seeded employee and sets a signed session cookie", async () => {
    const { ctx, cookies } = createContext(null);
    const caller = appRouter.createCaller(ctx);

    const session = await caller.auth.login({
      email: "avery@employee.com",
      password: DEFAULT_EMPLOYEE_PASSWORD,
    });

    expect(session).toMatchObject({
      email: "avery@employee.com",
      role: "employee",
      mustChangePassword: true,
    });
    expect(
      cookies.some(
        cookie =>
          cookie.name === SESSION_COOKIE_NAME &&
          cookie.value.split(".").length === 3
      )
    ).toBe(true);
  });

  it("rejects an incorrect employee password", async () => {
    const caller = appRouter.createCaller(createContext(null).ctx);
    await expect(
      caller.auth.login({
        email: "avery@employee.com",
        password: "wrong-password1",
      })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("signs in the built-in Manager and Administrator accounts", async () => {
    const manager = await appRouter
      .createCaller(createContext(null).ctx)
      .auth.login({ email: "manager@safeshift.com", password: "manager123" });
    const admin = await appRouter
      .createCaller(createContext(null).ctx)
      .auth.login({ email: "admin@safeshift.com", password: "admin123" });

    expect(manager).toMatchObject({
      role: "manager",
      mustChangePassword: false,
    });
    expect(admin).toMatchObject({
      role: "administrator",
      mustChangePassword: false,
    });
  });

  it("forces first sign-in setup once, then accepts only the new password", async () => {
    const employeeSession: SafeShiftSession = {
      email: "avery@employee.com",
      role: "employee",
      name: "Avery Patel",
      mustChangePassword: true,
    };
    const setup = await appRouter
      .createCaller(createContext(employeeSession).ctx)
      .auth.completeFirstLogin({
        newPassword: "AveryPass123",
        displayName: "Avery Patel",
        department: "Warehouse",
      });
    expect(setup).toMatchObject({
      email: "avery@employee.com",
      mustChangePassword: false,
    });

    const caller = appRouter.createCaller(createContext(null).ctx);
    await expect(
      caller.auth.login({
        email: "avery@employee.com",
        password: DEFAULT_EMPLOYEE_PASSWORD,
      })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    const returning = await caller.auth.login({
      email: "avery@employee.com",
      password: "AveryPass123",
    });
    expect(returning).toMatchObject({
      name: "Avery Patel",
      mustChangePassword: false,
    });
  });

  it("blocks first sign-in setup for non-employee sessions and completed accounts", async () => {
    const manager = await appRouter.createCaller(
      createContext({ ...adminSession, role: "manager" }).ctx
    );
    await expect(
      manager.auth.completeFirstLogin({
        newPassword: "ManagerPass1",
        displayName: "Manager",
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });

    const alreadySetUp: SafeShiftSession = {
      email: "avery@employee.com",
      role: "employee",
      name: "Avery Patel",
      mustChangePassword: false,
    };
    const repeat = await appRouter.createCaller(
      createContext(alreadySetUp).ctx
    );
    await expect(
      repeat.auth.completeFirstLogin({
        newPassword: "AnotherPass1",
        displayName: "Avery Patel",
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("lets the Administrator provision unique employee emails and rejects duplicates", async () => {
    const admin = appRouter.createCaller(createContext(adminSession).ctx);

    const created = await admin.employees.create({
      email: "Jordan@Employee.com",
      displayName: "Jordan Lee",
    });
    expect(created).toMatchObject({
      email: "jordan@employee.com",
      displayName: "Jordan Lee",
      mustChangePassword: true,
    });

    await expect(
      admin.employees.create({ email: "jordan@employee.com" })
    ).rejects.toMatchObject({ code: "CONFLICT" });

    const list = await admin.employees.list();
    expect(list.some(account => account.email === "jordan@employee.com")).toBe(
      true
    );
  });

  it("keeps employee management administrator-only", async () => {
    const employee: SafeShiftSession = {
      email: "avery@employee.com",
      role: "employee",
      name: "Avery Patel",
      mustChangePassword: false,
    };
    const caller = appRouter.createCaller(createContext(employee).ctx);

    await expect(caller.employees.list()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(
      caller.employees.create({ email: "new@employee.com" })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("resets an employee password and requires another first sign-in setup", async () => {
    const admin = appRouter.createCaller(createContext(adminSession).ctx);
    await admin.employees.resetPassword({
      email: "avery@employee.com",
      password: "ResetPass123",
    });

    const caller = appRouter.createCaller(createContext(null).ctx);
    const session = await caller.auth.login({
      email: "avery@employee.com",
      password: "ResetPass123",
    });
    expect(session).toMatchObject({ mustChangePassword: true });
  });

  it("locks repeated failed logins for the targeted account", async () => {
    const caller = appRouter.createCaller(createContext(null).ctx);
    for (let attempt = 0; attempt < 10; attempt += 1) {
      await expect(
        caller.auth.login({
          email: "casey@employee.com",
          password: "bad-password1",
        })
      ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    }
    await expect(
      caller.auth.login({
        email: "casey@employee.com",
        password: DEFAULT_EMPLOYEE_PASSWORD,
      })
    ).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
  });
});
