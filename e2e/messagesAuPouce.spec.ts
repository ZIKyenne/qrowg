import { test, expect } from "@playwright/test"

// Garde (21 nov.) — Messages au téléphone. Relevé de densité : c'était l'écran
// le plus chargé (21 commandes au 1er écran, deux rangées de filtres, un
// message ≈ un écran entier). Au téléphone : UNE rangée de filtres, des cartes
// compactes, « Appeler » / « Écrire » à un toucher, statut + suppression dans
// une feuille d'actions. Le bureau ne change pas.

const BANC = "/e2e-harness/messages"

test("au téléphone : le 1er message est haut, chaque carte est compacte", async ({ page }, info) => {
  test.skip(info.project.name !== "mobile", "téléphone seulement")
  await page.goto(BANC, { waitUntil: "networkidle", timeout: 120_000 })
  const cartes = page.locator("article[data-message]")
  await expect(cartes).toHaveCount(3)
  // Une seule rangée de filtres : les statuts y figurent, plus de « Tous les statuts ».
  await expect(page.getByRole("button", { name: "Tous les statuts" })).toHaveCount(0)
  await expect(page.locator(".msg-rangee")).toHaveCount(1)
  // L'export n'occupe plus le haut de l'écran.
  await expect(page.getByRole("button", { name: /Exporter CSV/ })).toHaveCount(0)
  await expect(page.getByRole("button", { name: /Exporter ces messages/ })).toBeVisible()

  const premiere = await cartes.first().boundingBox()
  expect(premiere!.y, "1er message dans le haut de l'écran").toBeLessThan(330)
  for (let i = 0; i < 3; i++) {
    const b = await cartes.nth(i).boundingBox()
    expect(b!.height, `carte ${i + 1} compacte`).toBeLessThan(240)
  }
})

test("au téléphone : appeler à un toucher, statut et suppression dans la feuille", async ({ page }, info) => {
  test.skip(info.project.name !== "mobile", "téléphone seulement")
  await page.goto(BANC, { waitUntil: "networkidle", timeout: 120_000 })
  const carte = page.locator("article[data-message]").first()
  await expect(carte.getByRole("link", { name: "Appeler" })).toHaveAttribute("href", /^tel:/)
  await expect(carte.getByRole("link", { name: "Écrire" })).toHaveAttribute("href", /^mailto:/)
  // Plus de corbeille à portée de pouce sur la carte.
  await expect(carte.getByRole("button", { name: /Supprimer/ })).toHaveCount(0)

  const statut = carte.getByRole("button", { name: /Statut : Nouveau/ })
  const h = (await statut.boundingBox())!.height
  expect(h, "cible du pouce").toBeGreaterThanOrEqual(44)
  await statut.click()
  const menu = page.getByRole("menu")
  await expect(menu).toBeVisible()
  for (const libelle of ["Nouveau", "En cours", "Traité", "Supprimer"]) {
    await expect(menu.getByRole("menuitem", { name: libelle })).toBeVisible()
  }
})

test("au bureau : rien ne change (sélecteur de statut et corbeille sur la carte)", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "bureau seulement")
  await page.goto(BANC, { waitUntil: "networkidle", timeout: 120_000 })
  await expect(page.locator("article[data-message]")).toHaveCount(0)
  await expect(page.getByRole("radiogroup", { name: "Statut de ce message" })).toHaveCount(3)
  await expect(page.getByRole("button", { name: "Supprimer ce message" })).toHaveCount(3)
  await expect(page.getByRole("button", { name: "Tous les statuts" })).toBeVisible()
})
