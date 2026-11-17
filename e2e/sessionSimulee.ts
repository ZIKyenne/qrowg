import { test, type Page } from "@playwright/test"

// Session simulée pour monter la VRAIE coquille du tableau de bord sans base
// (le projet Supabase de .env.local n'existe plus). Reprise telle quelle de
// galerieDashboardForfaits.spec.ts — voir l'explication complète là-bas :
// cookie `sb-<réf>-auth-token` plausible + appels Supabase interceptés (CORS compris).

export async function refDuProjet(page: Page, base: string): Promise<string> {
  const html = await (await page.request.get(base + "/creer")).text()
  const m = html.match(/https:\/\/([a-z0-9]+)\.supabase\.co/)
  if (!m) throw new Error("adresse Supabase introuvable sur " + base)
  return m[1]
}

const UTILISATEUR = {
  id: "00000000-0000-4000-8000-000000000001", aud: "authenticated", role: "authenticated",
  email: "demo@qrowg.com", email_confirmed_at: "2026-01-01T00:00:00Z",
  app_metadata: { provider: "email", providers: ["email"] }, user_metadata: {},
  created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z",
  identities: [], phone: "", confirmed_at: "2026-01-01T00:00:00Z",
}

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "*",
  "access-control-allow-methods": "GET,POST,PATCH,DELETE,OPTIONS",
  "access-control-expose-headers": "content-range, x-supabase-api-version",
  "content-type": "application/json",
}

export async function connecter(page: Page, plan: "free" | "pro") {
  const base = test.info().project.use.baseURL || "http://localhost"
  const REF = await refDuProjet(page, base)
  const session = {
    access_token: "session-simulee", token_type: "bearer", expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600, refresh_token: "rafraichissement-simule",
    user: UTILISATEUR,
  }
  const valeur = "base64-" + Buffer.from(JSON.stringify(session)).toString("base64").replace(/=+$/, "")
  // Le domaine suit l'adresse visée : la même suite sert en local et contre le
  // site en ligne (`playwright.prod.config.ts`).
  const hote = new URL(base).hostname
  await page.context().addCookies([{ name: `sb-${REF}-auth-token`, value: valeur, domain: hote, path: "/" }])

  await page.route(/supabase\.co\//, async route => {
    const req = route.request()
    if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers: CORS, body: "" })
    const url = req.url()
    if (url.includes("/auth/v1/user")) return route.fulfill({ status: 200, headers: CORS, body: JSON.stringify(UTILISATEUR) })
    if (url.includes("/auth/v1/token")) return route.fulfill({ status: 200, headers: CORS, body: JSON.stringify(session) })
    if (url.includes("/rest/v1/profiles")) {
      const seul = (req.headers()["accept"] || "").includes("pgrst.object")
      return route.fulfill({ status: 200, headers: CORS, body: JSON.stringify(seul ? { plan } : [{ plan }]) })
    }
    if (url.includes("/rest/v1/")) return route.fulfill({ status: 200, headers: { ...CORS, "content-range": "0-0/0" }, body: "[]" })
    return route.fulfill({ status: 200, headers: CORS, body: "{}" })
  })
}

