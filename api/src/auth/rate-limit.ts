// Counts attempts per key in memory. Fine for one API server; if Ganira ever
// runs several copies, this needs to move to shared storage.
export interface RateLimiter {
  // Returns false once the key has used up its attempts for this window.
  tryAttempt(key: string): boolean;
  reset(key: string): void;
}

export function createRateLimiter(maxAttempts: number, windowMs: number): RateLimiter {
  const counts = new Map<string, { count: number; resetAt: number }>();

  return {
    tryAttempt(key) {
      const now = Date.now();
      const entry = counts.get(key);
      if (!entry || entry.resetAt <= now) {
        counts.set(key, { count: 1, resetAt: now + windowMs });
        return true;
      }
      if (entry.count >= maxAttempts) return false;
      counts.set(key, { count: entry.count + 1, resetAt: entry.resetAt });
      return true;
    },
    reset(key) {
      counts.delete(key);
    },
  };
}
