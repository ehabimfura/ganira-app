import { createHash, randomBytes } from "node:crypto";

export const SESSION_DAYS = 30;

// 32 random bytes: impossible to guess, so a fast hash is enough to store it.
export function newToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function sessionExpiry(from = new Date()): Date {
  return new Date(from.getTime() + SESSION_DAYS * 24 * 60 * 60 * 1000);
}
