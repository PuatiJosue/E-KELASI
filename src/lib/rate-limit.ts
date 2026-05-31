// Rate limiter minimaliste en mémoire (token bucket).
//
// ⚠️ Limites connues :
//   - mémoire locale → ne fonctionne PAS de manière cohérente sur Vercel multi-instance
//     (chaque cold start a son propre cache). C'est OK pour bloquer le brute-force
//     opportuniste, INSUFFISANT contre un attaquant déterminé.
//   - À remplacer par @upstash/ratelimit (Redis) ou Vercel KV pour la prod sérieuse,
//     en gardant la même signature `ratelimit(key, opts)`.
//
// Usage :
//   if (!ratelimit(`login:${ip}`, { limit: 5, windowMs: 60_000 })) return 429;

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

// Nettoyage périodique pour ne pas faire grossir la Map indéfiniment.
let lastSweep = 0;
function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [k, b] of buckets) {
    if (b.resetAt < now) buckets.delete(k);
  }
}

export function ratelimit(
  key: string,
  opts: { limit: number; windowMs: number }
): boolean {
  const now = Date.now();
  sweep(now);
  const b = buckets.get(key);
  if (!b || b.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + opts.windowMs });
    return true;
  }
  if (b.count >= opts.limit) return false;
  b.count += 1;
  return true;
}
