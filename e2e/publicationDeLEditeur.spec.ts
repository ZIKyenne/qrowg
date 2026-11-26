import { test, expect, type Page, type Route } from "@playwright/test"
import { ouvrir, retenirLeDelai, titreEnBase, type Base } from "./editeurSurBaseSimulee"
import { SAVE_FAIL_MSG } from "../apps/web/src/app/dashboard/builder/publish"

// Publier depuis l'éditeur, joué dans Chromium (v391). Contrat (publish.ts) :
// intention → la DERNIÈRE version est écrite → le serveur passe la page en ligne
// → seulement alors « Votre page est en ligne ». Toute étape ratée s'arrête là,
// sans jamais afficher « en ligne ».
//
// La publication est une ACTION SERVEUR : côté serveur, Next parle lui-même à la
// base, hors de portée de Playwright. On joue donc la moitié navigateur : la
// requête de l'action est interceptée. Pour une réussite, on prend la VRAIE
// réponse du serveur (format de flux propre à la version de Next) et on n'en
// remplace que le résultat — jamais un format deviné. La moitié serveur
// (statut, date de 1re publication, revalidation) est jouée par publish.test.ts.

type Action = { demandes: number; titreAuMoment: string[]; lacher: () => void }

/** Intercepte l'action de publication. `reussite` : le serveur dit oui. `retenue` : pas de réponse avant `lacher()`. */
function action(page: Page, base: () => Base, opts: { reussite: boolean; retenue?: boolean }) {
  let lacher!: () => void
  const feu = opts.retenue ? new Promise<void>(r => { lacher = r }) : Promise.resolve()
  const a: Action = { demandes: 0, titreAuMoment: [], lacher: () => lacher?.() }
  const pose = () => page.route(u => u.pathname.startsWith("/dashboard/builder/"), async (route: Route) => {
    if (!route.request().headers()["next-action"]) return route.fallback()
    a.demandes++
    a.titreAuMoment.push(titreEnBase(base())())
    await feu
    const vraie = await route.fetch()
    const corps = await vraie.text()
    if (!opts.reussite) return route.fulfill({ response: vraie, body: corps })
    const oui = corps.replace(/\{"ok":false[^\n]*\}/, '{"ok":true,"publishedAt":"2026-11-26T10:00:00.000Z","alreadyPublished":false}')
    expect(oui, "la réponse du serveur a bien la forme attendue").not.toBe(corps)
    return route.fulfill({ response: vraie, body: oui })
  })
  return { a, pose }
}

const enLigne = (page: Page) => page.getByRole("dialog", { name: "Votre page est en ligne" })
const publier = (page: Page) => page.getByRole("button", { name: "Publier", exact: true }).first().click()

test.beforeEach(({}, info) => { test.skip(info.project.name === "mobile", "barre d'outils de bureau") })

test("publier juste après une frappe met en ligne la DERNIÈRE version", async ({ page }) => {
  let base!: Base
  const { a, pose } = action(page, () => base, { reussite: true })
  const ouvert = await ouvrir(page, pose)
  base = ouvert.base
  // Le délai de 0,8 s est retenu : seule la publication peut écrire la frappe.
  await retenirLeDelai(page)
  await ouvert.nom.fill("Le Comptoir du marché")
  await publier(page)
  await expect(enLigne(page)).toBeVisible({ timeout: 20_000 })
  expect(a.demandes, "une seule demande au serveur").toBe(1)
  expect(a.titreAuMoment, "la base avait la dernière version AVANT l'appel au serveur").toEqual(["Le Comptoir du marché"])
})

test("si l'enregistrement échoue, rien n'est publié et l'éditeur le dit", async ({ page }) => {
  let base!: Base
  const { a, pose } = action(page, () => base, { reussite: true })
  ;({ base } = await ouvrir(page, pose))
  base.refuser("pages")
  await page.getByLabel("Nom de la page").first().fill("Le Comptoir du marché")
  await publier(page)
  await expect(page.getByText(SAVE_FAIL_MSG).first()).toBeVisible({ timeout: 20_000 })
  expect(a.demandes, "le serveur n'est jamais appelé").toBe(0)
  await expect(enLigne(page)).toHaveCount(0)
})

test("si le serveur refuse, la page n'est pas annoncée en ligne et son message s'affiche", async ({ page }) => {
  let base!: Base
  // Réponse VRAIE du serveur de test : il ne joint aucune base, donc pas de session.
  const { a, pose } = action(page, () => base, { reussite: false })
  ;({ base } = await ouvrir(page, pose))
  await publier(page)
  await expect(page.getByText("Vous devez être connecté pour publier.").first()).toBeVisible({ timeout: 20_000 })
  expect(a.demandes).toBe(1)
  await expect(enLigne(page)).toHaveCount(0)
})

test("un double clic sur « Publier » n'envoie qu'une demande", async ({ page }) => {
  let base!: Base
  const { a, pose } = action(page, () => base, { reussite: true, retenue: true })
  ;({ base } = await ouvrir(page, pose))
  // Deux clics dans le MÊME instant, avant que React ait pu désactiver le bouton :
  // c'est le vrai double clic, celui que le `disabled` (asynchrone) ne couvre pas.
  await page.getByRole("button", { name: "Publier", exact: true }).first().evaluate(b => { (b as HTMLElement).click(); (b as HTMLElement).click() })
  await expect.poll(() => a.demandes).toBe(1)
  await page.waitForTimeout(1500)            // laisse à une seconde demande le temps de partir
  a.lacher()
  await expect(enLigne(page)).toBeVisible({ timeout: 20_000 })
  expect(a.demandes, "un seul flux réel").toBe(1)
})
