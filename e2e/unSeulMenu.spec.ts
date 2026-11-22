import { test, expect } from "@playwright/test"
import { connecter } from "./sessionSimulee"

// Revue du menu (22 nov.) — vraie coquille, session simulée. Au téléphone,
// connecté, le ☰ du haut ouvrait la même navigation que la barre du bas et sa
// feuille « Plus » : deux menus pour les mêmes portes. On n'en garde qu'un.
// Et la feuille disait l'abonnement dans « Profil » : il est dans Paramètres.

test.beforeEach(async ({}, info) => {
  test.skip(info.project.name !== "mobile", "téléphone seulement")
  test.setTimeout(240_000)
})

const ECRAN = "/dashboard/templates"

test("connecté : un seul menu, la barre du bas ; le forfait reste dans le menu du compte", async ({ page }) => {
  await connecter(page, "pro")
  await page.goto(ECRAN, { waitUntil: "networkidle", timeout: 180_000 })
  await expect(page.getByRole("button", { name: "Plus" })).toBeVisible()
  await expect(page.getByRole("button", { name: "Ouvrir le menu" })).toHaveCount(0)

  // Ce que le tiroir montrait en plus — le forfait et son quota — est à un toucher.
  await page.getByRole("button", { name: "Mon compte" }).click()
  const compte = page.getByRole("menu", { name: "Mon compte" })
  await expect(compte).toContainText(/Plan /)
  await expect(compte.getByRole("menuitem", { name: "Voir les offres" })).toBeVisible()
})

test("connecté : « Plus » range Paramètres avant Profil, et dit où est l'abonnement", async ({ page }) => {
  await connecter(page, "pro")
  await page.goto(ECRAN, { waitUntil: "networkidle", timeout: 180_000 })
  await expect(async () => {
    await page.getByRole("button", { name: "Plus" }).click()
    await expect(page.getByRole("dialog", { name: "Toutes les sections" })).toBeVisible({ timeout: 1000 })
  }).toPass({ timeout: 15_000 })
  const feuille = page.getByRole("dialog", { name: "Toutes les sections" })
  const liens = await feuille.locator("a").evaluateAll(as => as.map(a => a.getAttribute("href")))
  expect(liens.indexOf("/dashboard/settings")).toBeLessThan(liens.indexOf("/dashboard/profile"))
  await expect(feuille.locator('a[href="/dashboard/settings"]')).toContainText("Abonnement")
  await expect(feuille.locator('a[href="/dashboard/profile"]')).not.toContainText(/abonnement/i)
})

test("sans compte : le ☰ reste (sa barre n'a pas de « Plus »)", async ({ page }) => {
  await page.goto(ECRAN, { waitUntil: "networkidle", timeout: 180_000 })
  await expect(page.getByRole("button", { name: "Plus" })).toHaveCount(0)
  await expect(page.getByRole("button", { name: "Ouvrir le menu" })).toBeVisible()
})
