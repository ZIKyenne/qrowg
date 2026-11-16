import { test, expect } from "@playwright/test"

// Atelier d'impression (16 nov.) : un support cliqué ouvre d'abord le CHOIX DU
// MODÈLE ; l'éditeur n'a plus de bouton « Modèles » (ni d'onglet « Thème » sur
// téléphone). Son retour ramène au choix du modèle, puis aux supports.

test("support → choix du modèle → éditeur, sans bouton « Modèles » dans l'éditeur", async ({ page }, info) => {
  await page.goto("/e2e-harness/print-studio")
  await page.locator(".ps2-card", { hasText: "Wi-Fi" }).first().click()

  await expect(page.getByRole("heading", { level: 1, name: "Choisissez un modèle" })).toBeVisible()
  await page.addStyleTag({ content: "nextjs-portal{display:none!important}" }).catch(() => {})
  await page.screenshot({ path: `test-results/atelier-choix-${info.project.name}.png` })

  // Un modèle choisi ouvre l'éditeur, avec ses textes.
  await page.getByRole("button", { name: /Wi-Fi · Invité/ }).first().click()
  await expect(page.getByText("Wi-Fi gratuit", { exact: false }).first()).toBeVisible()
  await expect(page.getByRole("button", { name: "Partir d'un modèle" })).toHaveCount(0)
  if (info.project.name === "mobile") await expect(page.getByRole("button", { name: "Thème", exact: true })).toHaveCount(0)

  // Retour : le choix du modèle, puis les supports.
  await page.getByRole("button", { name: "Modèles" }).click()
  await expect(page.getByRole("heading", { level: 1, name: "Choisissez un modèle" })).toBeVisible()
  await page.getByRole("button", { name: "Supports" }).click()
  await expect(page.getByRole("heading", { level: 1, name: "Choisissez un support" })).toBeVisible()
})

test("« Garder le design de base » ouvre l'éditeur tel quel", async ({ page }) => {
  await page.goto("/e2e-harness/print-studio")
  await page.locator(".ps2-card").first().click()
  await page.getByRole("button", { name: "Garder le design de base" }).click()
  await expect(page.getByRole("button", { name: "Modèles" })).toBeVisible()
})
