import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { parse as parseCookieHeader } from "cookie";
import type { User } from "../../drizzle/schema";
import {
  SESSION_COOKIE_NAME,
  SafeShiftSession,
  verifySessionToken,
} from "../security";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  session: SafeShiftSession | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  let session: SafeShiftSession | null = null;
  try {
    const token = parseCookieHeader(opts.req.headers.cookie ?? "")[
      SESSION_COOKIE_NAME
    ];
    if (token) session = await verifySessionToken(token);
  } catch {
    session = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
    session,
  };
}
