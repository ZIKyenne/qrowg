import { test, expect, type Page } from "@playwright/test"

// L'éditeur à plat de l'atelier d'impression (bureau) : il est sorti de
// PrintStudioClient en v384, avec la barre de zoom et la bibliothèque
// « + Ajouter ». Aucun test ne le jouait. Celui-ci fait ce qu'on y fait :
// zoomer, poser un texte, le déplacer à la souris, poser une forme.
//
// v385 : un ajout tombait au centre — donc sur le QR (capture de v384). Il se
// pose désormais à la place libre la plus proche. Mesuré : les mises en page
// par défaut REMPLISSENT le support (titre, grand QR, bouton), si bien qu'un
// texte de 0,44 de large ne tient presque jamais sans rien toucher. La garantie
// tenue partout, et vérifiée ici : jamais sur le QR, jamais sur un élément déjà
// posé. Le cas « libre de tout » est vérifié par vocabulaireDuSupport.test.

async function ouvrirLEditeur(page: Page, support: string) {
  await page.goto("/e2e-harness/print-studio", { waitUntil: "networkidle" })
  await page.locator(".ps2-card", { hasText: support }).first().click()
  await page.getByRole("button", { name: "Garder le design de base" }).click()
  await expect(page.getByRole("button", { name: "Zoomer", exact: true })).toBeVisible()
}

type Boite = { x: number; y: number; width: number; height: number }
const seCroisent = (a: Boite, b: Boite) =>
  !(a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y)

// Les éléments libres posés sur le support : ce sont les seuls qu'on déplace.
const elementsLibres = (page: Page) => page.locator('.ps-aside [style*="cursor: move"]')
const boiteDuQr = async (page: Page) => (await page.locator(".ps-aside [data-qr-du-support]").first().boundingBox())!

async function ajouterUnCercle(page: Page) {
  await page.getByRole("button", { name: "Ajouter une icône, une forme, une composition" }).click()
  const fenetre = page.getByRole("dialog", { name: "Ajouter un élément" })
  await expect(fenetre).toBeVisible()
  await fenetre.getByPlaceholder("Rechercher (avis, Wi-Fi, réserver…)").fill("cercle")
  await fenetre.getByRole("button", { name: /Cercle/ }).first().click()
  await expect(fenetre).toHaveCount(0)
}

test("l'éditeur à plat : zoomer, poser un texte, le déplacer, poser une forme — ni sur le QR, ni sur le texte", async ({ page }, info) => {
  test.skip(info.project.name === "mobile", "l'éditeur à plat est l'aperçu du bureau ; le téléphone garde l'aperçu guidé")
  await ouvrirLEditeur(page, "Sticker vitrine")

  // Zoom : 100 % → 110 % → ajusté.
  const zoom = page.locator(".ps-aside").getByText(/^\d+ %$/)
  await expect(zoom).toHaveText("100 %")
  await page.getByRole("button", { name: "Zoomer", exact: true }).click()
  await expect(zoom).toHaveText("110 %")
  await page.getByRole("button", { name: "Ajuster", exact: true }).click()
  await expect(zoom).toHaveText("100 %")

  // Un texte posé depuis le rail apparaît, hors du QR.
  const avant = await elementsLibres(page).count()
  await page.getByRole("button", { name: "Ajouter un texte" }).click()
  await expect(elementsLibres(page)).toHaveCount(avant + 1)
  // Par son rang, pas « le dernier » : après l'ajout du cercle, le dernier, c'est lui.
  const texte = elementsLibres(page).nth(avant)
  const t0 = (await texte.boundingBox())!
  expect(seCroisent(t0, await boiteDuQr(page)), "le texte ajouté couvre le QR").toBe(false)

  // Glissé à la souris, il suit.
  await page.mouse.move(t0.x + t0.width / 2, t0.y + t0.height / 2)
  await page.mouse.down()
  await page.mouse.move(t0.x + t0.width / 2 + 30, t0.y + t0.height / 2 + 12, { steps: 8 })
  await page.mouse.up()
  const t1 = (await texte.boundingBox())!
  expect(Math.abs(t1.x - t0.x) + Math.abs(t1.y - t0.y), "le texte a suivi la souris").toBeGreaterThan(20)

  // « + Ajouter » → un cercle : ni sur le QR, ni sur le texte déjà posé.
  await ajouterUnCercle(page)
  await expect(elementsLibres(page)).toHaveCount(avant + 2)
  const cercle = (await elementsLibres(page).last().boundingBox())!
  expect(seCroisent(cercle, await boiteDuQr(page)), "le cercle ajouté couvre le QR").toBe(false)
  expect(seCroisent(cercle, (await texte.boundingBox())!), "le cercle ajouté couvre le texte").toBe(false)
  await page.locator(".ps-aside").screenshot({ path: `test-results/editeur-a-plat-${info.project.name}.png` })
})

test("sur un petit support plein, un ajout peut chevaucher un titre — jamais le QR", async ({ page }, info) => {
  test.skip(info.project.name === "mobile", "éditeur à plat du bureau")
  // Ø 50 mm : titre, QR et bouton occupent tout le cercle de sécurité. Mesuré :
  // un texte de 0,44 de large n'y tient nulle part sans rien toucher.
  await ouvrirLEditeur(page, "Sticker de table")
  await page.getByRole("button", { name: "Ajouter un texte" }).click()
  await ajouterUnCercle(page)
  const qr = await boiteDuQr(page)
  for (const el of await elementsLibres(page).all()) expect(seCroisent((await el.boundingBox())!, qr), "un ajout couvre le QR").toBe(false)
  await page.locator(".ps-aside").screenshot({ path: `test-results/editeur-a-plat-petit-${info.project.name}.png` })
})
