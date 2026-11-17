import "server-only";

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

/**
 * Small in-memory rate limit per client IP. On Vercel each server instance keeps its own
 * counts, so this is a speed bump against spam, not a hard guarantee.
 */
export function rateLimited(request: Request, action: string, max: number, windowMs: number): boolean {
  const key = `${action}:${clientIp(request)}`;
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    if (buckets.size > 5000) for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
    return false;
  }
  bucket.count += 1;
  return bucket.count > max;
}

export function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local";
}

export function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export const tooMany = () => json({ error: "Too many requests. Wait a few minutes and try again." }, 429);
export const notConfigured = () => json({ error: "The server isn't fully configured yet (Supabase secret key missing)." }, 503);

/** Origin of this site, for links in emails. */
export function siteOrigin(request: Request): string {
  const env = process.env.NEXT_PUBLIC_SITE_URL;
  if (env) return env.replace(/\/$/, "");
  return new URL(request.url).origin;
}
