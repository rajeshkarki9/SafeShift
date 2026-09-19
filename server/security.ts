import {
  randomBytes,
  scryptSync,
  timingSafeEqual,
  createHmac,
} from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { ENV } from "./_core/env";

export type SafeShiftRole = "employee" | "manager" | "administrator";

export type SafeShiftSession = {
  email: string;
  role: SafeShiftRole;
  name: string;
  mustChangePassword: boolean;
};

export const SESSION_COOKIE_NAME = "safeshift_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;

// JWT_SECRET is provisioned in managed environments; the fallback keeps local
// development working. Sessions are still signed, never plaintext.
const sessionSecretBytes = () =>
  new TextEncoder().encode(
    ENV.cookieSecret || "safeshift-local-session-secret"
  );

export async function createSessionToken(
  session: SafeShiftSession
): Promise<string> {
  return new SignJWT({
    role: session.role,
    name: session.name,
    mustChangePassword: session.mustChangePassword,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(session.email)
    .setIssuedAt()
    .setExpirationTime(Math.floor((Date.now() + SESSION_TTL_MS) / 1000))
    .setJti(randomBytes(12).toString("hex"))
    .sign(sessionSecretBytes());
}

export async function verifySessionToken(
  token: string
): Promise<SafeShiftSession | null> {
  try {
    const { payload } = await jwtVerify(token, sessionSecretBytes(), {
      algorithms: ["HS256"],
    });
    const email = payload.sub;
    const role = payload.role as SafeShiftRole | undefined;
    if (
      !email ||
      (role !== "employee" && role !== "manager" && role !== "administrator")
    )
      return null;
    return {
      email,
      role,
      name: typeof payload.name === "string" ? payload.name : "",
      mustChangePassword: payload.mustChangePassword === true,
    };
  } catch {
    return null;
  }
}

export const SESSION_MAX_AGE_SECONDS = Math.floor(SESSION_TTL_MS / 1000);

/* Password hashing — scrypt with a per-password random salt. */

const SCRYPT_KEYLEN = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, SCRYPT_KEYLEN).toString("hex");
  return `scrypt:${salt}:${derived}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, salt, expected] = stored.split(":");
  if (scheme !== "scrypt" || !salt || !expected) return false;
  const derived = scryptSync(password, salt, SCRYPT_KEYLEN);
  const expectedBytes = Buffer.from(expected, "hex");
  if (derived.length !== expectedBytes.length) return false;
  return timingSafeEqual(derived, expectedBytes);
}

// Constant-time comparison for the built-in staff passwords without needing a
// precomputed salt.
export function constantTimeEquals(
  candidate: string,
  expected: string
): boolean {
  const key = ENV.cookieSecret || "safeshift-local-compare-key";
  const a = createHmac("sha256", key).update(candidate).digest();
  const b = createHmac("sha256", key).update(expected).digest();
  return timingSafeEqual(a, b);
}

export function isStrongPassword(password: string): boolean {
  return (
    password.length >= 8 && /[a-zA-Z]/.test(password) && /\d/.test(password)
  );
}
