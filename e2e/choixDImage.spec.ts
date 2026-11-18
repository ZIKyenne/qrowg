import { test, expect, type Page } from "@playwright/test"

// Lot 6 « appli » (18 nov.) : le choix de la source d'une image est LA feuille
// d'actions — annoncée comme menu, fermée au bouton retour, et chaque source
// garde son explication. Banc : le champ image de l'éditeur, sans session.

const BANC = "/e2e-harness/image-upload"

async function ouvrirChoix(page: Page) {
  await page.goto("/e2e-harness/coquille/detail", { waitUntil: "networkidle" })
  await page.goto(BANC, { waitUntil: "networkidle" })
  await expect(async () => {
    await page.getByRole("button", { name: /Changer d'image/ }).click()
    await expect(page.getByRole("dialog", { name: "Ajouter une image" })).toBeVisible({ timeout: 1000 })
  }).toPass({ timeout: 15000 })
}

test("les deux sources, avec leur explication, à 52 px au moins", async ({ page }, testInfo) => {
  await ouvrirChoix(page)
  const menu = page.getByRole("menu")
  await expect(menu.getByRole("menuitem")).toHaveCount(2)
  await expect(menu.getByRole("menuitem", { name: /Depuis mon téléphone/ })).toContainText("Photo, photothèque ou fichier")
  await expect(menu.getByRole("menuitem", { name: /Ma bibliothèque QRowg/ })).toContainText("Images déjà importées")
  for (const h of await menu.getByRole("menuitem").evaluateAll(els => els.map(e => e.getBoundingClientRect().height)))
    expect(h).toBeGreaterThanOrEqual(52)
  await testInfo.attach(`choix-${testInfo.project.name}`, { body: await page.screenshot(), contentType: "image/png" })
})

test("le bouton retour ferme le choix, sans quitter l'écran", async ({ page }) => {
  await ouvrirChoix(page)
  await page.goBack()
  await expect(page.getByRole("dialog")).toHaveCount(0)
  expect(new URL(page.url()).pathname).toBe(BANC)
})

test("« Depuis mon téléphone » ouvre le sélecteur de fichier dans le même geste", async ({ page }) => {
  await ouvrirChoix(page)
  const choix = page.waitForEvent("filechooser", { timeout: 5000 })
  await page.getByRole("menuitem", { name: /Depuis mon téléphone/ }).click()
  await choix
  await expect(page.getByRole("dialog", { name: "Ajouter une image" })).toHaveCount(0)
})
