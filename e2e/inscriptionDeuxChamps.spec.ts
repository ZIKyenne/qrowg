import { test, expect } from "@playwright/test"

// Vague 1, point 3 : l'inscription tient en deux champs, sans défiler au téléphone.

test("inscription : e-mail, mot de passe, et le bouton à portée de pouce", async ({ page }, info) => {
  await page.goto("/auth/signup")
  const form = page.locator("form").filter({ has: page.getByRole("button", { name: /Créer mon compte/ }) })
  const champs = form.locator("input:not([type=hidden])")
  await expect(champs).toHaveCount(2)
  await expect(form.getByLabel("Email")).toBeVisible()
  await expect(form.getByLabel("Mot de passe", { exact: true })).toBeVisible()
  await expect(page.getByLabel("Nom complet")).toHaveCount(0)

  // On remplit au clavier, dans l'ordre : e-mail → mot de passe → bouton.
  await form.getByLabel("Email").fill("essai@exemple.fr")
  await page.keyboard.press("Tab")
  await expect(form.getByLabel("Mot de passe", { exact: true })).toBeFocused()

  const bouton = page.getByRole("button", { name: /Créer mon compte/ })
  await bouton.scrollIntoViewIfNeeded()
  const boite = await bouton.boundingBox()
  expect(boite!.height).toBeGreaterThanOrEqual(44)
  await page.screenshot({ path: `test-results/inscription-deux-champs-${info.project.name}.png` })
})
