import { test, expect, type Page } from "@playwright/test"

// L'éditeur à plat de l'atelier d'impression (bureau) : il est sorti de
// PrintStudioClient en v384, avec la barre de zoom et la bibliothèque
// « + Ajouter ». Aucun test ne le jouait. Celui-ci fait ce qu'on y fait :
// zoomer, poser un texte, le déplacer à la souris, poser une forme.

async function ouvrirLEditeur(page: Page) {
  await page.goto("/e2e-harness/print-studio", { waitUntil: "networkidle" })
  await page.locator(".ps2-card").first().click()
  await page.getByRole("button", { name: "Garder le design de base" }).click()
  await expect(page.getByRole("button", { name: "Zoomer", exact: true })).toBeVisible()
}

// Les éléments libres posés sur le support : ce sont les seuls qu'on déplace.
const elementsLibres = (page: Page) => page.locator('.ps-aside [style*="cursor: move"]')

test("l'éditeur à plat : zoomer, poser un texte, le déplacer, poser une forme", async ({ page }, info) => {
  test.skip(info.project.name === "mobile", "l'éditeur à plat est l'aperçu du bureau ; le téléphone garde l'aperçu guidé")
  await ouvrirLEditeur(page)

  // Zoom : 100 % → 110 % → ajusté.
  const zoom = page.locator(".ps-aside").getByText(/^\d+ %$/)
  await expect(zoom).toHaveText("100 %")
  await page.getByRole("button", { name: "Zoomer", exact: true }).click()
  await expect(zoom).toHaveText("110 %")
  await page.getByRole("button", { name: "Ajuster", exact: true }).click()
  await expect(zoom).toHaveText("100 %")

  // Un texte posé depuis le rail apparaît sur le support.
  const avant = await elementsLibres(page).count()
  await page.getByRole("button", { name: "Ajouter un texte" }).click()
  await expect(elementsLibres(page)).toHaveCount(avant + 1)
  const texte = elementsLibres(page).last()

  // Glissé à la souris, il suit.
  const a = (await texte.boundingBox())!
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2)
  await page.mouse.down()
  await page.mouse.move(a.x + a.width / 2 + 40, a.y + a.height / 2 + 50, { steps: 8 })
  await page.mouse.up()
  const b = (await texte.boundingBox())!
  expect(Math.abs(b.x - a.x) + Math.abs(b.y - a.y), "le texte a suivi la souris").toBeGreaterThan(20)

  // « + Ajouter » : la bibliothèque s'ouvre, une forme s'y choisit, et se pose.
  await page.getByRole("button", { name: "Ajouter une icône, une forme, une composition" }).click()
  const fenetre = page.getByRole("dialog", { name: "Ajouter un élément" })
  await expect(fenetre).toBeVisible()
  await fenetre.getByPlaceholder("Rechercher (avis, Wi-Fi, réserver…)").fill("cercle")
  await fenetre.getByRole("button", { name: /Cercle/ }).first().click()
  await expect(fenetre).toHaveCount(0)
  await expect(elementsLibres(page)).toHaveCount(avant + 2)
  await page.locator(".ps-aside").screenshot({ path: `test-results/editeur-a-plat-${info.project.name}.png` })
})
