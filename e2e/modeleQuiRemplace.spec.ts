import { test, expect, type Page } from "@playwright/test"

// Un modèle REMPLACE le design, il ne se pose pas dessus — joué dans l'atelier
// (v392). Avant, ce contrat n'était protégé que par des citations du code
// (atelier.test.ts) : la liste des remises à zéro, et le filtre des éléments.
//
// Le défaut trouvé en le jouant : le filtre effaçait aussi les COMPOSITIONS
// (« + Ajouter → Compositions prêtes »), c'est-à-dire un ajout de l'utilisateur.
// Il visait les compositions que les modèles posaient d'office autrefois ; ils
// ne le font plus, et la règle « son travail ne disparaît pas sous un modèle »
// ne tenait plus que pour les textes, formes et icônes.

const SUPPORT = "Sticker vitrine"
const MODELE = /Fleuriste · Réseaux/

const elementsLibres = (page: Page) => page.locator('.ps-aside [style*="cursor: move"]')
const apercu = (page: Page) => page.locator(".ps-aside [data-support-apercu]").first()

/** Une empreinte du design rendu : taille et place du QR, taille du titre. */
async function empreinte(page: Page) {
  const qr = (await page.locator(".ps-aside [data-qr-du-support]").first().boundingBox())!
  const base = (await apercu(page).boundingBox())!
  const titre = await apercu(page).getByText("Suivez-nous", { exact: true }).first()
    .evaluate(el => getComputedStyle(el).fontSize)
  const r = (n: number) => Math.round(n)
  return { qrLargeur: r(qr.width), qrHaut: r(qr.y - base.y), titre }
}

async function ouvrirLeSupport(page: Page) {
  await page.goto("/e2e-harness/print-studio", { waitUntil: "networkidle" })
  await page.locator(".ps2-card", { hasText: SUPPORT }).first().click()
}
async function choisirLeModele(page: Page) {
  await page.getByRole("button", { name: MODELE }).first().click()
  await expect(page.getByRole("button", { name: "Zoomer", exact: true })).toBeVisible()
}
/** Le curseur d'un champ de réglage, par l'intitulé du champ. */
const curseur = (page: Page, intitule: string) =>
  page.locator("p", { hasText: new RegExp(`^${intitule}$`) }).locator("xpath=..").locator("input[type=range]").first()
/** Règle un curseur comme le ferait la main (valeur native + événement). */
const pousserAuMax = (page: Page, curseur: ReturnType<Page["locator"]>) => curseur.evaluate(el => {
  const r = el as HTMLInputElement
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(r, r.max)
  r.dispatchEvent(new Event("input", { bubbles: true }))
})

test.beforeEach(({}, info) => { test.skip(info.project.name === "mobile", "éditeur à plat du bureau (les éléments libres se posent là)") })

test("changer de modèle remet le design à zéro, et garde ce que l'utilisateur a ajouté", async ({ page }) => {
  // Référence : le modèle appliqué sur un support neuf.
  await ouvrirLeSupport(page)
  await choisirLeModele(page)
  const reference = await empreinte(page)
  await expect(elementsLibres(page)).toHaveCount(0)

  // On travaille le design à la main…
  await ouvrirLeSupport(page)
  await choisirLeModele(page)
  await page.getByRole("tab", { name: "Contenu" }).click()
  await pousserAuMax(page, page.locator("input[type=range]").first())                       // QR agrandi
  await page.getByRole("tab", { name: "Page" }).click()
  await pousserAuMax(page, curseur(page, "Taille du titre"))                                  // titre agrandi
  await pousserAuMax(page, curseur(page, "Air autour"))                                       // marges élargies
  await pousserAuMax(page, curseur(page, "Placement vertical"))                               // bloc descendu
  const travaille = await empreinte(page)
  expect(travaille, "les réglages ont bien changé le rendu").not.toEqual(reference)

  // …et on y ajoute un texte et une composition.
  await page.getByRole("button", { name: "Ajouter un texte" }).click()
  await expect(elementsLibres(page)).toHaveCount(1)
  await page.getByRole("button", { name: "Ajouter une icône, une forme, une composition" }).click()
  const fenetre = page.getByRole("dialog", { name: "Ajouter un élément" })
  await fenetre.getByText("Compositions prêtes").locator("xpath=following-sibling::div[1]").getByRole("button").first().click()
  await expect(fenetre).toHaveCount(0)
  const ajoutes = await elementsLibres(page).count()
  expect(ajoutes, "une composition pose plusieurs éléments").toBeGreaterThan(2)

  // Retour aux modèles, le même modèle de nouveau.
  await page.getByRole("button", { name: "Modèles" }).click()
  await choisirLeModele(page)

  expect(await empreinte(page), "le design est celui du modèle, pas un mélange").toEqual(reference)
  await expect(elementsLibres(page), "le texte ET la composition ajoutés sont toujours là").toHaveCount(ajoutes)
  await expect(apercu(page).getByText("Votre texte")).toHaveCount(1)
})
