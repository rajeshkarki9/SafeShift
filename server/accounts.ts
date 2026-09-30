import { count, eq } from "drizzle-orm";
import { employeeAccounts } from "../drizzle/schema";
import { getDb } from "./db";
import {
  SafeShiftRole,
  constantTimeEquals,
  hashPassword,
  verifyPassword,
} from "./security";

export type EmployeeAccountPublic = {
  id: number;
  email: string;
  displayName: string;
  mustChangePassword: boolean;
  department: string | null;
  phone: string | null;
  lastSignedIn: Date | null;
  createdAt: Date;
};

type StoredAccount = EmployeeAccountPublic & { passwordHash: string };

export class DuplicateEmailError extends Error {
  constructor(email: string) {
    super(`An account for ${email} already exists.`);
    this.name = "DuplicateEmailError";
  }
}

/**
 * Built-in Manager login. Employee logins live in the
 * `employee_accounts` table.
 */
const STAFF_ACCOUNTS: Array<{ email: string; password: string; role: SafeShiftRole; name: string }> = [
  { email: "manager@safeshift.com", password: "manager123", role: "manager", name: "Manager" },
];

export const DEFAULT_EMPLOYEE_PASSWORD = "safeshift123";

const SEED_ACCOUNTS: Array<{
  email: string;
  displayName: string;
  password: string;
}> = [
  {
    email: "avery@employee.com",
    displayName: "Avery Patel",
    password: DEFAULT_EMPLOYEE_PASSWORD,
  },
  {
    email: "blake@employee.com",
    displayName: "Blake Hughes",
    password: DEFAULT_EMPLOYEE_PASSWORD,
  },
  {
    email: "casey@employee.com",
    displayName: "Casey Morgan",
    password: DEFAULT_EMPLOYEE_PASSWORD,
  },
];

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function findStaffAccount(email: string, password: string) {
  const account = STAFF_ACCOUNTS.find(
    staff => staff.email === normalizeEmail(email)
  );
  if (!account || !constantTimeEquals(password, account.password)) return null;
  return { email: account.email, role: account.role, name: account.name };
}

/* In-memory fallback so the login flow still works without a database. */

let memoryStore: Map<string, StoredAccount> | null = null;
let memoryId = 0;

function getMemoryStore(): Map<string, StoredAccount> {
  if (!memoryStore) {
    memoryStore = new Map();
    for (const seed of SEED_ACCOUNTS) {
      memoryStore.set(seed.email, {
        id: ++memoryId,
        email: seed.email,
        displayName: seed.displayName,
        passwordHash: hashPassword(seed.password),
        mustChangePassword: true,
        department: null,
        phone: null,
        lastSignedIn: null,
        createdAt: new Date(),
      });
    }
  }
  return memoryStore;
}

function sanitize(account: StoredAccount): EmployeeAccountPublic {
  const { passwordHash: _hash, ...publicAccount } = account;
  return publicAccount;
}

async function dbSelectByEmail(
  email: string
): Promise<StoredAccount | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db
    .select()
    .from(employeeAccounts)
    .where(eq(employeeAccounts.email, email))
    .limit(1);
  const row = rows[0];
  if (!row) return undefined;
  return {
    id: row.id,
    email: row.email,
    displayName: row.displayName,
    passwordHash: row.passwordHash,
    mustChangePassword: Boolean(row.mustChangePassword),
    department: row.department ?? null,
    phone: row.phone ?? null,
    lastSignedIn: row.lastSignedIn ?? null,
    createdAt: row.createdAt,
  };
}

async function dbEnsureSeeded(): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const [{ value }] = await db
    .select({ value: count() })
    .from(employeeAccounts);
  if (value > 0) return;
  const rows = SEED_ACCOUNTS.map(seed => ({
    email: seed.email,
    displayName: seed.displayName,
    passwordHash: hashPassword(seed.password),
    mustChangePassword: 1,
  }));
  await db.insert(employeeAccounts).values(rows).onConflictDoNothing();
}

/** Resolve an account, preferring the database and falling back to memory. */
async function getAccount(
  email: string
): Promise<{ account: StoredAccount; source: "db" | "memory" } | null> {
  const normalized = normalizeEmail(email);
  try {
    await dbEnsureSeeded();
    const row = await dbSelectByEmail(normalized);
    if (row) return { account: row, source: "db" };
  } catch (error) {
    console.warn(
      "[Accounts] Database lookup failed, using in-memory store:",
      error
    );
  }
  const memory = getMemoryStore().get(normalized);
  return memory ? { account: memory, source: "memory" } : null;
}

export async function getEmployeeAccount(
  email: string
): Promise<EmployeeAccountPublic | null> {
  const found = await getAccount(email);
  return found ? sanitize(found.account) : null;
}

export async function listEmployeeAccounts(): Promise<EmployeeAccountPublic[]> {
  try {
    await dbEnsureSeeded();
    const db = await getDb();
    if (db) {
      const rows = await db.select().from(employeeAccounts);
      return rows.map(row =>
        sanitize({
          id: row.id,
          email: row.email,
          displayName: row.displayName,
          passwordHash: row.passwordHash,
          mustChangePassword: Boolean(row.mustChangePassword),
          department: row.department ?? null,
          phone: row.phone ?? null,
          lastSignedIn: row.lastSignedIn ?? null,
          createdAt: row.createdAt,
        })
      );
    }
  } catch (error) {
    console.warn(
      "[Accounts] Database list failed, using in-memory store:",
      error
    );
  }
  return Array.from(getMemoryStore().values()).map(sanitize);
}

export async function verifyEmployeeCredentials(
  email: string,
  password: string
): Promise<EmployeeAccountPublic | null> {
  const found = await getAccount(email);
  if (!found || !verifyPassword(password, found.account.passwordHash))
    return null;

  const normalized = normalizeEmail(email);
  try {
    const db = await getDb();
    if (db) {
      await db
        .update(employeeAccounts)
        .set({ lastSignedIn: new Date() })
        .where(eq(employeeAccounts.email, normalized));
    }
  } catch (error) {
    console.warn("[Accounts] Could not update lastSignedIn:", error);
  }
  if (found.source === "memory") found.account.lastSignedIn = new Date();
  return sanitize(found.account);
}

export async function createEmployeeAccount(input: {
  email: string;
  displayName?: string;
  password: string;
}): Promise<EmployeeAccountPublic> {
  const email = normalizeEmail(input.email);
  const displayName = input.displayName?.trim() || "Employee";
  const record = {
    email,
    displayName,
    passwordHash: hashPassword(input.password),
    mustChangePassword: 1,
  };

  const db = await getDb();
  if (db) {
    try {
      await db.insert(employeeAccounts).values(record);
      const created = await dbSelectByEmail(email);
      if (created) return sanitize(created);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (/duplicate/i.test(message)) throw new DuplicateEmailError(email);
      console.warn(
        "[Accounts] Database insert failed, using in-memory store:",
        error
      );
    }
  }

  const store = getMemoryStore();
  if (store.has(email)) throw new DuplicateEmailError(email);
  const stored: StoredAccount = {
    id: ++memoryId,
    email,
    displayName,
    passwordHash: record.passwordHash,
    mustChangePassword: true,
    department: null,
    phone: null,
    lastSignedIn: null,
    createdAt: new Date(),
  };
  store.set(email, stored);
  return sanitize(stored);
}

export async function completeFirstLogin(
  email: string,
  input: {
    newPassword: string;
    displayName: string;
    department?: string | null;
    phone?: string | null;
  }
): Promise<EmployeeAccountPublic> {
  const normalized = normalizeEmail(email);
  const updates = {
    passwordHash: hashPassword(input.newPassword),
    mustChangePassword: 0,
    displayName: input.displayName.trim(),
    department: input.department?.trim() || null,
    phone: input.phone?.trim() || null,
    lastSignedIn: new Date(),
  };

  const db = await getDb();
  if (db) {
    try {
      await db
        .update(employeeAccounts)
        .set(updates)
        .where(eq(employeeAccounts.email, normalized));
      const updated = await dbSelectByEmail(normalized);
      if (updated) return sanitize(updated);
    } catch (error) {
      console.warn(
        "[Accounts] Database update failed, using in-memory store:",
        error
      );
    }
  }

  const memory = getMemoryStore().get(normalized);
  if (!memory) throw new Error("Account not found");
  memory.passwordHash = updates.passwordHash;
  memory.mustChangePassword = false;
  memory.displayName = updates.displayName;
  memory.department = updates.department;
  memory.phone = updates.phone;
  memory.lastSignedIn = updates.lastSignedIn;
  return sanitize(memory);
}

export async function resetEmployeePassword(
  email: string,
  newPassword: string
): Promise<EmployeeAccountPublic> {
  const normalized = normalizeEmail(email);
  const updates = {
    passwordHash: hashPassword(newPassword),
    mustChangePassword: 1,
  };

  const db = await getDb();
  if (db) {
    try {
      await db
        .update(employeeAccounts)
        .set(updates)
        .where(eq(employeeAccounts.email, normalized));
      const updated = await dbSelectByEmail(normalized);
      if (updated) return sanitize(updated);
    } catch (error) {
      console.warn(
        "[Accounts] Database reset failed, using in-memory store:",
        error
      );
    }
  }

  const memory = getMemoryStore().get(normalized);
  if (!memory) throw new Error("Account not found");
  memory.passwordHash = updates.passwordHash;
  memory.mustChangePassword = true;
  return sanitize(memory);
}

/* Login throttling — slows brute-force attempts against the login endpoint. */

const MAX_FAILURES = 10;
const WINDOW_MS = 15 * 60 * 1000;
const failures = new Map<
  string,
  { firstFailureAt: number; attempts: number; lockedUntil: number }
>();

export function recordLoginFailure(email: string) {
  const key = normalizeEmail(email);
  const now = Date.now();
  const entry = failures.get(key);
  if (!entry || now - entry.firstFailureAt > WINDOW_MS) {
    failures.set(key, { firstFailureAt: now, attempts: 1, lockedUntil: 0 });
    return;
  }
  entry.attempts += 1;
  if (entry.attempts >= MAX_FAILURES) entry.lockedUntil = now + WINDOW_MS;
}

export function isLoginLocked(email: string): boolean {
  const entry = failures.get(normalizeEmail(email));
  return Boolean(entry && entry.lockedUntil > Date.now());
}

export function clearLoginFailures(email: string) {
  failures.delete(normalizeEmail(email));
}

/** Test hook — restores a pristine in-memory store. */
export function __resetAccountsForTests() {
  memoryStore = null;
  memoryId = 0;
  failures.clear();
}
