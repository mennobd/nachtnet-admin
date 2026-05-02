import "server-only";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

const cleanup = setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
}, 60_000);

cleanup.unref();

export function checkRateLimit(
  key: string,
  { max, windowMs }: { max: number; windowMs: number }
): { ok: boolean; retryAfter?: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    return { ok: true };
  }

  if (bucket.count >= max) {
    return {
      ok: false,
      retryAfter: Math.ceil((bucket.resetAt - now) / 1000),
    };
  }

  return { ok: true };
}

export function consumeRateLimit(
  key: string,
  { max: _max, windowMs }: { max: number; windowMs: number }
): void {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }

  bucket.count += 1;
}
