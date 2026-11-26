import { test, expect, type Page } from "@playwright/test"

// La disposition de l'atelier (bureau), jouée — v395. Avant, atelier.test.ts
// citait le code : l'ordre de `ps-rail` et `ps-aside` dans le fichier, le texte
// d'un useEffect, la présence de `flexWrap: "wrap"`. Ici, on regarde l'écran.
//
// « Trop de défauts partout, l'interface doit être méga simplifiée, pas 30
// onglets à ouvrir et à faire défiler. » Contrat : créer à gauche, régler à
// droite ; trois onglets toujours visibles ; sélectionner un élément amène ses
// réglages sans rien chercher ; aucune rangée de choix ne cache d'options.

async function ouvrir(page: Page) {
  await page.goto("/e2e-harness/print-studio", { waitUntil: "networkidle" })
  await page.locator(".ps2-card", { hasText: "Sticker vitrine" }).first().click()
  await page.getByRole("button", { name: "Garder le design de base" }).click()
  await expect(page.getByRole("tablist", { name: "Réglages" })).toBeVisible()
}
const onglets = (page: Page) => page.getByRole("tablist", { name: "Réglages" }).getByRole("tab")
const actif = (page: Page) => page.getByRole("tablist", { name: "Réglages" }).locator('[role="tab"][aria-selected="true"]')

test.beforeEach(({}, info) => { test.skip(info.project.name === "mobile", "disposition du bureau (le téléphone a sa feuille : feuilleMobile.spec.ts)") })

test("créer à gauche, voir au centre, régler à droite — trois onglets, aucun accordéon", async ({ page }) => {
  await ouvrir(page)
  const rail = (await page.locator(".ps-rail").first().boundingBox())!
  const apercu = (await page.locator(".ps-aside").first().boundingBox())!
  const reglages = (await page.getByRole("tablist", { name: "Réglages" }).boundingBox())!
  expect(rail.x + rail.width, "le rail d'outils est à gauche de l'aperçu").toBeLessThanOrEqual(apercu.x + 1)
  expect(apercu.width, "l'aperçu n'est pas écrasé par le rail").toBeGreaterThan(300)
  expect(reglages.x, "les réglages sont à droite de l'aperçu").toBeGreaterThanOrEqual(apercu.x + apercu.width - 1)

  await expect(onglets(page)).toHaveText(["Contenu", "Style", "Page"])
  await expect(actif(page)).toHaveText("Contenu")
  // Un onglet = un clic, sans rien replier ni déplier.
  for (const [nom, champ] of [["Style", "Ambiance"], ["Page", "Disposition"], ["Contenu", "Taille du QR"]] as const) {
    await page.getByRole("tab", { name: nom, exact: true }).click()
    await expect(actif(page)).toHaveText(nom)
    await expect(page.locator(".ps-panels p", { hasText: new RegExp(`^${champ}$`) }).first(), `${nom} montre « ${champ} »`).toBeVisible()
  }
  await expect(page.locator(".ps-panels [aria-expanded], .ps-panels details"), "aucun accordéon dans les réglages").toHaveCount(0)
})

test("sélectionner un élément ouvre ses réglages ; changer d'onglet le désélectionne", async ({ page }) => {
  await ouvrir(page)
  await expect(page.getByRole("tab", { name: "Sélection" })).toHaveCount(0)

  // Un texte posé est sélectionné d'office : ses réglages arrivent, sans rien chercher.
  await page.getByRole("button", { name: "Ajouter un texte" }).click()
  await expect(actif(page)).toHaveText("Sélection")

  // Un autre onglet : l'élément est lâché, et l'onglet « Sélection » s'en va.
  await page.getByRole("tab", { name: "Style", exact: true }).click()
  await expect(actif(page)).toHaveText("Style")
  await expect(page.getByRole("tab", { name: "Sélection" })).toHaveCount(0)

  // Toucher l'élément sur le support le resélectionne.
  await page.locator('.ps-aside [style*="cursor: move"]').first().click()
  await expect(actif(page)).toHaveText("Sélection")
})

test("aucune rangée de choix ne cache d'options : elles s'enroulent", async ({ page }) => {
  await ouvrir(page)
  await page.getByRole("tab", { name: "Page", exact: true }).click()
  const colonne = (await page.locator(".ps-panels").first().boundingBox())!
  for (const champ of ["Disposition", "Fond"]) {
    const rangee = page.locator(".ps-panels p", { hasText: new RegExp(`^${champ}$`) }).first().locator("xpath=following-sibling::div[1]")
    const choix = rangee.getByRole("button")
    expect(await choix.count(), `${champ} a des choix`).toBeGreaterThan(2)
    expect(await rangee.evaluate(el => el.scrollWidth <= el.clientWidth + 1), `${champ} : rien ne défile à l'horizontale`).toBe(true)
    for (const b of await choix.all()) {
      const r = (await b.boundingBox())!
      expect(r.x + r.width, `${champ} : « ${await b.innerText()} » tient dans la colonne`).toBeLessThanOrEqual(colonne.x + colonne.width + 1)
    }
  }
})
