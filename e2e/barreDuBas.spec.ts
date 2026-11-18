import { test, expect } from "@playwright/test"

// Lot 5 « appli » (18 nov.) : la feuille « Plus » de la barre du bas est LA
// feuille (MobileSheet). Faite main, elle ne se fermait pas au bouton retour —
// le retour quittait l'écran derrière elle. Banc : la vraie MobileNav, sans session.

test.beforeEach(async ({}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "barre du bas = téléphone")
})

const BANC = "/e2e-harness/coquille/nav"
const ouvrirPlus = async (page: import("@playwright/test").Page) => {
  await expect(async () => {
    await page.getByRole("button", { name: "Plus" }).click()
    await expect(page.getByRole("dialog", { name: "Toutes les sections" })).toBeVisible({ timeout: 1000 })
  }).toPass({ timeout: 15000 })
}

test("« Plus » : le bouton retour ferme la feuille, sans quitter l'écran", async ({ page }, testInfo) => {
  await page.goto("/e2e-harness/coquille/detail", { waitUntil: "networkidle" })
  await page.goto(BANC, { waitUntil: "networkidle" })
  await ouvrirPlus(page)
  await testInfo.attach("plus-ouverte", { body: await page.screenshot(), contentType: "image/png" })
  await page.goBack()
  await expect(page.getByRole("dialog")).toHaveCount(0)
  expect(new URL(page.url()).pathname).toBe(BANC)
})

test("« Plus » : la croix ferme, et rend le focus au bouton", async ({ page }) => {
  await page.goto(BANC, { waitUntil: "networkidle" })
  await ouvrirPlus(page)
  await page.getByTestId("mobile-sheet-close").click()
  await expect(page.getByRole("dialog")).toHaveCount(0)
  await expect(page.getByRole("button", { name: "Plus" })).toBeFocused()
})

test("« Plus » : suivre un lien mène à l'écran, sans retour en arrière parasite", async ({ page }) => {
  await page.goto(BANC, { waitUntil: "networkidle" })
  await ouvrirPlus(page)
  await page.getByRole("dialog").getByRole("link", { name: /Modèles/ }).click()
  await expect.poll(() => new URL(page.url()).pathname).toBe("/dashboard/templates")
  // Le retrait de l'entrée d'historique arrive « au tour suivant » : on laisse
  // passer ce tour, et l'adresse doit tenir.
  await page.waitForTimeout(1500)
  expect(new URL(page.url()).pathname).toBe("/dashboard/templates")
  // Et le retour ramène à l'écran quitté (l'entrée laissée derrière porte la
  // même adresse) — jamais hors du site, jamais une page blanche.
  await page.goBack()
  await expect.poll(() => new URL(page.url()).pathname).toBe(BANC)
  await expect(page.getByRole("button", { name: "Plus" })).toBeVisible()
})
