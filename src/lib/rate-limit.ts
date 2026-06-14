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

// Verrouillage après X échecs (brute-force d'un compte ciblé).
// Contrairement à `ratelimit` (qui compte TOUTES les tentatives), ceci ne
// compte que les ÉCHECS et se réinitialise sur un succès. Même caveat
// multi-instance que ci-dessus : protège bien le brute-force opportuniste,
// à remplacer par un store persistant (Redis/KV) pour une garantie totale.
type FailRecord = { fails: number; windowResetAt: number; lockedUntil: number };
const failures = new Map<string, FailRecord>();

// Nettoyage périodique pour ne pas faire grossir les Map indéfiniment.
let lastSweep = 0;
function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [k, b] of buckets) {
    if (b.resetAt < now) buckets.delete(k);
  }
  for (const [k, r] of failures) {
    if (r.lockedUntil < now && r.windowResetAt < now) failures.delete(k);
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

// Renvoie le nombre de ms restant si la clé est verrouillée, sinon 0.
export function checkLockout(key: string): number {
  const now = Date.now();
  sweep(now);
  const r = failures.get(key);
  if (r && r.lockedUntil > now) return r.lockedUntil - now;
  return 0;
}

// À appeler sur un ÉCHEC d'authentification. Après `maxFailures` échecs dans
// la fenêtre, la clé est verrouillée pour `lockMs`.
export function recordFailure(
  key: string,
  opts: { maxFailures: number; windowMs: number; lockMs: number }
): void {
  const now = Date.now();
  let r = failures.get(key);
  if (!r || r.windowResetAt < now) {
    r = { fails: 0, windowResetAt: now + opts.windowMs, lockedUntil: 0 };
  }
  r.fails += 1;
  if (r.fails >= opts.maxFailures) {
    r.lockedUntil = now + opts.lockMs;
    r.fails = 0;
    r.windowResetAt = now + opts.windowMs;
  }
  failures.set(key, r);
}

// À appeler sur un SUCCÈS : on efface le compteur d'échecs.
export function clearFailures(key: string): void {
  failures.delete(key);
}
