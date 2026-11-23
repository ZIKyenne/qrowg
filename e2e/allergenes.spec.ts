import { test, expect } from "@playwright/test"

// Vague 2, point 2 (revue du 23 nov.) : les 14 allergènes renseignés dans Ma
// carte, affichés sous chaque produit, sur toutes les cartes.

test("Ma carte : renseigner les allergènes d'un cocktail, puis « aucun » pour un autre", async ({ page }, info) => {
  await page.goto("/e2e-harness/ma-carte")
  await page.getByRole("button", { name: "Allergènes", exact: true }).click()
  await expect(page.getByText(/^\d+ produits sans allergènes renseignés$/)).toBeVisible()
  const avant = Number((await page.getByText(/^\d+ produits sans allergènes renseignés$/).textContent())!.split(" ")[0])

  const cocktails = page.getByRole("region", { name: "Cocktails signature" })
  await cocktails.getByRole("button", { name: /^Allergènes de Espresso Martini \(démo\) : Non renseigné/ }).click()
  const form = page.getByRole("form", { name: "Allergènes de Espresso Martini (démo)" })
  await form.getByRole("button", { name: "Lait", exact: true }).click()
  await form.getByRole("button", { name: "Gluten", exact: true }).click()
  await expect(form.getByRole("button", { name: "Lait", exact: true })).toHaveAttribute("aria-pressed", "true")
  await page.screenshot({ path: `test-results/allergenes-choix-${info.project.name}.png` })
  await form.getByRole("button", { name: "Enregistrer" }).click()
  // Ordre du règlement : Gluten avant Lait, quel que soit l'ordre des touchers.
  await expect(cocktails.getByRole("button", { name: /^Allergènes de Espresso Martini \(démo\) : Gluten, Lait/ })).toBeVisible()

  await cocktails.getByRole("button", { name: /^Allergènes de Mojito \(démo\)/ }).click()
  const f2 = page.getByRole("form", { name: "Allergènes de Mojito (démo)" })
  await expect(f2.getByRole("button", { name: "Enregistrer" })).toBeDisabled()   // rien coché ≠ « aucun »
  await f2.getByRole("button", { name: "Aucun des 14" }).click()
  await f2.getByRole("button", { name: "Enregistrer" }).click()
  await expect(cocktails.getByRole("button", { name: /^Allergènes de Mojito \(démo\) : Aucun des 14 allergènes/ })).toBeVisible()
  await expect(page.getByText(`${avant - 2} produits sans allergènes renseignés`)).toBeVisible()
})

test("page publique : « Allergènes : … » sous le produit", async ({ page }, info) => {
  await page.goto("/e2e-harness/public-page?t=resto_bistrot&allergenes=" + encodeURIComponent("Soupe à l'oignon · Gratinée au comté:gluten,lait"))
  const ligne = page.getByText("Allergènes : Gluten, Lait", { exact: true })
  await ligne.scrollIntoViewIfNeeded()
  await expect(ligne).toBeVisible()
  await ligne.locator("xpath=../..").screenshot({ path: `test-results/allergenes-public-${info.project.name}.png` })
})
