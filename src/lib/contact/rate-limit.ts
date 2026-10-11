/**
 * Fixed-window counter per key, in memory. Best-effort: each server instance
 * keeps its own counts (spec §1: owner-approved; Turnstile, the honeypot and
 * Resend's daily cap cover the gaps).
 */
export function createRateLimiter({
  limit,
  windowMs,
  now = Date.now,
}: {
  limit: number;
  windowMs: number;
  now?: () => number;
}) {
  const buckets = new Map<string, { count: number; resetAt: number }>();

  function prune(t: number) {
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= t) buckets.delete(key);
    }
  }

  return {
    hit(key: string): { ok: true } | { ok: false; retryAfterMs: number } {
      const t = now();
      prune(t);
      const bucket = buckets.get(key);
      if (!bucket) {
        buckets.set(key, { count: 1, resetAt: t + windowMs });
        return { ok: true };
      }
      if (bucket.count >= limit) {
        return { ok: false, retryAfterMs: bucket.resetAt - t };
      }
      bucket.count += 1;
      return { ok: true };
    },
    /** For tests: number of live buckets. */
    size: () => buckets.size,
  };
}

/** 3 messages per 10 minutes per visitor IP. */
export const contactLimiter = createRateLimiter({
  limit: 3,
  windowMs: 10 * 60 * 1000,
});

/** First x-forwarded-for entry, then x-real-ip, then "unknown". */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip")?.trim() || "unknown";
}
