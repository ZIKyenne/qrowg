import { test, expect, type Page } from "@playwright/test"

// 19 nov. — « au scroll, ça remet en haut de la page » (galerie, tout déplié).
// Cause : chaque miniature qui entrait à l'écran rendait un bloc dont le code se
// charge à la demande ; sans frontière <Suspense> locale, la suspension remontait
// jusqu'au `dashboard/loading.tsx` — la galerie devenait un squelette de 1 000 px,
// le défilement était ramené en haut, puis la page revenait. Mesuré ici : la
// hauteur du contenu ne doit JAMAIS s'effondrer pendant qu'on fait défiler.
// Session simulée : même procédé que galerieDashboardForfaits.spec.ts.
async function refDuProjet(page: Page, base: string): Promise<string> {
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

async function connecter(page: Page, plan: "free" | "pro") {
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

const TITRES = 'article.tpl-card h2[id^="tpl-nom-"]'

test("la galerie dépliée se fait défiler jusqu'en bas sans jamais remonter", async ({ page }, info) => {
  test.skip(info.project.name !== "mobile", "la zone qui défile est celle de la coquille mobile")
  test.setTimeout(180_000)
  await connecter(page, "free")
  await page.goto("/dashboard/templates", { waitUntil: "networkidle" })
  await expect(page.locator('[data-galerie="prete"]')).toBeAttached({ timeout: 30_000 })
  const bouton = page.getByRole("button", { name: /Voir les \d+ autres modèles/ })
  if (await bouton.count()) await bouton.first().click()
  await expect(page.locator("article.tpl-card").nth(20)).toBeAttached({ timeout: 20_000 })
  // Guetteur image par image : la plus forte chute de hauteur observée.
  await page.evaluate(() => {
    const W = window as any; const m = document.querySelector(".qd-main") as HTMLElement
    W.__chute = 0; let avant = m.scrollHeight
    const tick = () => { const h = m.scrollHeight; W.__chute = Math.max(W.__chute, avant - h); avant = h; requestAnimationFrame(tick) }
    requestAnimationFrame(tick)
  })
  let prec = 0
  for (let i = 0; i < 16; i++) {
    await page.mouse.wheel(0, 500)
    await page.waitForTimeout(250)
    const y = await page.evaluate(() => (document.querySelector(".qd-main") as HTMLElement).scrollTop)
    expect(y, `pas ${i} : le défilement est revenu en arrière`).toBeGreaterThanOrEqual(prec - 2)
    prec = y
  }
  expect(prec, "on est bien descendu dans la galerie").toBeGreaterThan(4000)
  expect(await page.evaluate(() => (window as any).__chute), "la hauteur de la galerie s'est effondrée").toBeLessThan(200)
})
