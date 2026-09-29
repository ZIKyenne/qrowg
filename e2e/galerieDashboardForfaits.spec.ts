import { test, expect, type Page } from "@playwright/test"

// La galerie de modèles DANS LE TABLEAU DE BORD, connecté, dans les deux états de
// forfait — ce que `/creer` ne peut pas montrer (un visiteur y est toujours en
// gratuit, et la coquille du tableau de bord n'y est pas).
//
// Le projet Supabase du dépôt n'existe plus (NXDOMAIN), donc aucune vraie session
// n'est possible sur cette machine. On monte donc le VRAI écran avec une session
// simulée : un cookie `sb-<ref>-auth-token` plausible + les appels au domaine
// Supabase interceptés dans le navigateur. La coquille serveur
// (`dashboard/layout.tsx`) ne fait que lire ce cookie, et l'écran lui-même
// confirme avec `getUser()` côté client — donc interceptable. Ce qui est vérifié
// ici est le VRAI code de l'écran ; ce qui est simulé, c'est uniquement la
// réponse du serveur d'authentification et la ligne `profiles.plan`.
//
// Deux pièges, chèrement acquis : le cookie doit contenir une session complète
// (sinon supabase-js l'ignore et l'écran repasse en mode invité), et les réponses
// interceptées doivent porter leurs en-têtes CORS — sinon le navigateur les
// refuse et l'écran croit l'appel en échec.

/**
 * La référence du projet Supabase VISÉ, lue sur la page servie.
 *
 * Elle diffère d'un environnement à l'autre : le `.env.local` du dépôt pointe sur
 * un projet supprimé (`fmiskpokjxjtwhknrvtg`), la production sur un projet bien
 * vivant. Or le cookie de session s'appelle `sb-<réf>-auth-token` : viser la
 * mauvaise référence, c'est être ignoré par supabase-js et retomber en mode
 * invité — l'écran paraît alors verrouillé à tort. On la lit donc sur place.
 */
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
const carteNommee = (page: Page, nom: string) => page.locator(`${TITRES}:text-is(${JSON.stringify(nom)})`)
const champRecherche = (page: Page) => page.getByLabel(/Rechercher un modèle par nom/)
const cartes = (page: Page) => page.locator("article.tpl-card")

async function ouvrirTableauDeBord(page: Page, plan: "free" | "pro") {
  await connecter(page, plan)
  await page.goto("/dashboard/templates", { waitUntil: "networkidle" })
  await expect(page, "redirigé hors du tableau de bord : la session simulée n'a pas pris")
    .toHaveURL(/\/dashboard\/templates/)
  await expect(page.locator('[data-galerie="prete"]')).toBeAttached({ timeout: 30_000 })
  await expect(cartes(page).first()).toBeVisible({ timeout: 30_000 })
}

/**
 * Ouvre l'aperçu d'une carte, une fois la carte POSÉE.
 *
 * Les miniatures se dessinent à l'approche de l'écran : dérouler les 48 modèles
 * puis cliquer aussitôt, c'est cliquer pendant que les vignettes arrivent et
 * décalent la grille sous le curseur. On attend donc que la miniature de CETTE
 * carte soit dessinée — son propre repère — avant de viser son bouton.
 */
async function ouvrirApercu(page: Page, carte: ReturnType<Page["locator"]>) {
  await carte.scrollIntoViewIfNeeded()
  await expect(carte.locator('[data-mini-dessine="1"]')).toBeAttached({ timeout: 20_000 })
  await carte.getByRole("button", { name: /^Aperçu de / }).first().click()
  await expect(page.getByRole("dialog")).toBeVisible({ timeout: 20_000 })
}

async function toutDerouler(page: Page) {
  const bouton = page.getByRole("button", { name: /Voir les \d+ autres modèles/ })
  if (await bouton.count()) await bouton.first().click()
  await expect(cartes(page).nth(20)).toBeVisible({ timeout: 20_000 })
}

test.describe("galerie du tableau de bord — connecté", () => {
  test("la coquille connectée est bien montée (ce n'est pas /creer)", async ({ page }) => {
    await ouvrirTableauDeBord(page, "free")
    // Le menu du tableau de bord n'existe que pour quelqu'un qui a un compte.
    await expect(page.getByRole("link", { name: /Statistiques|Messages/ }).first()).toBeVisible()
  })

  for (const plan of ["free", "pro"] as const) {
    test(`plan ${plan} : filtres, recherche et compteurs`, async ({ page }, info) => {
      // Les chips de secteur ne sont en ligne que sur desktop — sur mobile elles
      // vivent dans la feuille « Filtrer », couverte par `galerieDeModeles.spec`.
      test.skip(info.project.name !== "desktop", "chips en ligne = desktop")
      await ouvrirTableauDeBord(page, plan)
      // Compteur = nombre de cartes, avec le même juge que le filtre.
      for (const secteur of [/^Restaurant/, /^Bar/, /^Café/, /^Artisan/]) {
        const chip = page.getByRole("button", { name: secteur }).first()
        const annonce = Number(((await chip.innerText()).match(/(\d+)\s*$/) || [])[1])
        await chip.click()
        await expect(cartes(page), `chip ${secteur} annonce ${annonce}`).toHaveCount(annonce, { timeout: 20_000 })
      }
      await page.getByRole("button", { name: /^Tous\b/ }).first().click()
      // Recherche : le cas qui manquait à l'audit.
      await champRecherche(page).fill("cafe")
      await expect(carteNommee(page, "Coffee shop")).toBeVisible({ timeout: 20_000 })
      await champRecherche(page).fill("")
      // Les modèles payants restent VISIBLES quel que soit le plan.
      await toutDerouler(page)
      await expect(carteNommee(page, "Vente de produits numériques")).toBeVisible()
    })
  }

  test("plan gratuit : les modèles payants sont verrouillés, l'aperçu reste ouvrable", async ({ page }) => {
    await ouvrirTableauDeBord(page, "free")
    await toutDerouler(page)
    const payante = cartes(page).filter({ has: page.locator('h2:text-is("Vente de produits numériques")') }).first()
    await payante.scrollIntoViewIfNeeded()
    await expect(payante.getByRole("button", { name: /Débloquer/ })).toBeVisible()
    await expect(payante.getByRole("button", { name: "Utiliser" })).toHaveCount(0)
    // Un modèle verrouillé reste une vitrine : son aperçu s'ouvre.
    await ouvrirApercu(page, payante)
    await expect(page.getByRole("button", { name: /Plan .* requis/ })).toBeVisible()
    await page.keyboard.press("Escape")
    await expect(page.getByRole("dialog")).toHaveCount(0)
    // Et un modèle gratuit, lui, s'utilise.
    const libre = cartes(page).filter({ has: page.locator('h2:text-is("Bistrot français")') }).first()
    await libre.scrollIntoViewIfNeeded()
    await libre.getByRole("button", { name: "Utiliser" }).first().click()
    await expect(page.getByRole("dialog", { name: /Créer une page depuis ce modèle/ })).toBeVisible()
    await page.keyboard.press("Escape")
  })

  test("plan payant : plus aucun verrou, toutes les actions sont ouvertes", async ({ page }) => {
    await ouvrirTableauDeBord(page, "pro")
    await toutDerouler(page)
    expect(await page.getByRole("button", { name: /Débloquer/ }).count(), "un verrou subsiste en plan payant").toBe(0)
    const payante = cartes(page).filter({ has: page.locator('h2:text-is("Vente de produits numériques")') }).first()
    await payante.scrollIntoViewIfNeeded()
    await expect(payante.getByRole("button", { name: "Utiliser" })).toBeVisible()
    await ouvrirApercu(page, payante)
    // L'aperçu d'un modèle ouvert montre TOUS ses blocs, sans le pavé « Aperçu limité ».
    await expect(page.getByText("Aperçu limite")).toHaveCount(0)
    await page.keyboard.press("Escape")
  })

  test("les favoris se posent et survivent au rechargement", async ({ page }) => {
    await ouvrirTableauDeBord(page, "free")
    const premiere = cartes(page).first()
    const nom = await premiere.locator('h2[id^="tpl-nom-"]').innerText()
    await premiere.getByRole("button", { name: "Ajouter aux favoris" }).click()
    await expect(premiere.getByRole("button", { name: "Retirer des favoris" })).toBeVisible()
    await page.reload({ waitUntil: "networkidle" })
    await expect(page.locator('[data-galerie="prete"]')).toBeAttached({ timeout: 30_000 })
    const memeCarte = cartes(page).filter({ has: page.locator(`h2:text-is(${JSON.stringify(nom)})`) }).first()
    await expect(memeCarte.getByRole("button", { name: "Retirer des favoris" }),
      "le favori n'a pas survécu au rechargement").toBeVisible({ timeout: 20_000 })
    // Et il se retire.
    await memeCarte.getByRole("button", { name: "Retirer des favoris" }).click()
    await expect(memeCarte.getByRole("button", { name: "Ajouter aux favoris" })).toBeVisible()
  })

  test("l'aperçu s'ouvre en haut ici aussi, et rend le focus", async ({ page }) => {
    await ouvrirTableauDeBord(page, "free")
    await ouvrirApercu(page, cartes(page).first())
    expect(await page.locator(".preview-scroll").first().evaluate(el => el.scrollTop)).toBe(0)
    expect(await page.evaluate(() => !!(document.activeElement as HTMLElement | null)?.closest("[inert]"))).toBe(false)
    await page.keyboard.press("Escape")
    await expect(page.getByRole("dialog")).toHaveCount(0)
    expect(await page.evaluate(() => (document.activeElement as HTMLElement | null)?.getAttribute("aria-label") || ""))
      .toContain("Aperçu de")
  })
})
