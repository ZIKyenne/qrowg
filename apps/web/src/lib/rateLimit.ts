// Rate-limiter en mémoire, best-effort.
// ⚠️ LIMITE : en serverless (Vercel), la mémoire n'est PAS partagée entre
// instances et est perdue au cold start -> protection seulement partielle.
// À remplacer par un store partagé (Upstash Redis / @vercel/kv) en phase 2.
const buckets = new Map<string, { count: number; reset: number }>()

export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now()
  const e = buckets.get(key)
  if (!e || now > e.reset) {
    buckets.set(key, { count: 1, reset: now + windowMs })
    return true
  }
  if (e.count >= max) return false
  e.count++
  return true
}

export function ipOf(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
}

// Vrai si l'appelant serveur fournit le bon jeton interne (routes non exposées
// au client : welcome, first-scan, subscription). Réutilise CRON_SECRET.
export function hasInternalToken(req: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  return req.headers.get("x-internal-token") === secret
}
