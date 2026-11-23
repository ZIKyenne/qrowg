import { test, expect } from "@playwright/test"

// Vague 1 (revue du 23 nov.) : la carte illustrée, les boissons et l'happy hour
// dans Ma carte. Banc Ma carte (le vrai module pur) + banc de page publique.

test("Ma carte : épuiser un burger, changer le prix d'une pression, deux prix → l'éditeur", async ({ page }, info) => {
  await page.goto("/e2e-harness/ma-carte")
  const burgers = page.getByRole("region", { name: "Snack · Burgers" })
  await expect(burgers).toBeVisible()
  await expect(page.getByRole("region", { name: "Vins · Rouges" })).toBeVisible()
  await expect(page.getByRole("region", { name: "Happy hour" })).toBeVisible()

  await burgers.getByRole("switch", { name: /Burger maison \(démo\)/ }).click()
  await expect(burgers.getByRole("switch", { name: /Burger maison \(démo\)/ })).toHaveAttribute("aria-checked", "false")
  // Ces cartes se composent dans l'éditeur : pas d'« Ajouter un produit » ici.
  await expect(burgers.getByRole("button", { name: /Ajouter un produit/ })).toHaveCount(0)

  await page.getByRole("button", { name: "Prix", exact: true }).click()
  const bieres = page.getByRole("region", { name: "Vins · Bières" })
  const prix = bieres.getByLabel("Prix de Pression (démo)")
  await prix.fill("5,5")
  await prix.press("Enter")
  await expect(prix).toHaveValue("5,5 €")
  await expect(page.getByRole("region", { name: "Vins · Rouges" }).getByText("deux prix : dans l'éditeur")).toBeVisible()
  await page.getByRole("region", { name: "Vins · Rouges" }).screenshot({ path: `test-results/deux-prix-${info.project.name}.png` })
  await page.screenshot({ path: `test-results/autres-cartes-prix-${info.project.name}.png`, fullPage: true })

  await page.getByRole("button", { name: "Modifier", exact: true }).click()
  await expect(burgers.getByRole("link", { name: "Ajouter ou corriger dans l'éditeur" })).toHaveAttribute("href", /\/dashboard\/builder\//)
})

test("page publique : le produit épuisé reste, barré, avec la mention — carte illustrée", async ({ page }, info) => {
  await page.goto("/e2e-harness/public-page?t=resto_fastfood&epuise=" + encodeURIComponent("Frites maison"))
  const frites = page.locator("[data-produit]").filter({ hasText: "Frites maison" }).first()
  await frites.scrollIntoViewIfNeeded()
  await expect(frites.getByText("Frites maison", { exact: true })).toHaveCSS("text-decoration-line", "line-through")
  await expect(frites.getByText("Épuisé", { exact: true })).toBeVisible()
  await frites.screenshot({ path: `test-results/autres-cartes-illustree-${info.project.name}.png` })
})

test("page publique : boissons et happy hour", async ({ page }, info) => {
  await page.goto("/e2e-harness/public-page?t=resto_pub&epuise=" + encodeURIComponent("Pinte blonde"))
  const pinte = page.getByText("Pinte blonde", { exact: true }).first()
  await pinte.scrollIntoViewIfNeeded()
  await expect(pinte).toHaveCSS("text-decoration-line", "line-through")
  await expect(pinte.locator("xpath=..").getByText("Épuisé", { exact: true })).toBeVisible()
  await pinte.locator("xpath=../..").screenshot({ path: `test-results/autres-cartes-happy-${info.project.name}.png` })
})
