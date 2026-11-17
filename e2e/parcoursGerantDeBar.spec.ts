import { test, expect } from "@playwright/test"

// Parcours d'un gérant de bar, sans compte, sur téléphone (17 novembre) :
// accueil → galerie → « Bar à cocktails » → nom + carte collée → éditeur → Publier.
// Ce qu'il a révélé : le nom saisi ne s'affichait pas (« The Alchemist »), la
// fenêtre demandait une description et parlait de « blocs », la feuille
// « Publier » montrait « Réduit / Moyen / Plein », « 9 blocs » et un lien vers
// une page pas encore en ligne, sans dire qu'un compte suivait.

const CARTE = ["COCKTAILS", "Mojito 9 €", "Spritz 8 €", "", "BIÈRES", "Blonde pression 5 €"].join("\n")

test("du modèle à la publication, la page porte SON nom et la publication se dit simplement", async ({ page }, info) => {
  test.skip(info.project.name !== "mobile", "parcours téléphone")
  test.setTimeout(120_000)
  await page.goto("/creer")
  await expect(page.locator('[data-galerie="prete"]')).toBeAttached({ timeout: 30_000 })   // page démarrée
  await page.getByRole("button", { name: "Utiliser", exact: true }).first().click()

  const fenetre = page.getByRole("dialog")
  await expect(fenetre).toContainText("Modèle « Bar à cocktails »")
  await expect(fenetre).not.toContainText(/\d+ blocs/)
  await expect(fenetre.getByLabel(/Description/)).toHaveCount(0)
  const nom = fenetre.getByLabel("Nom affiché sur la page")
  await expect(nom).toHaveValue("")
  await nom.fill("Le Comptoir")
  await fenetre.getByRole("button", { name: /Vous avez déjà une carte/ }).click()
  await fenetre.locator("textarea").first().fill(CARTE)
  await fenetre.getByRole("button", { name: /Composer ma page/ }).click()

  await page.waitForURL(/\/dashboard\/builder/)
  await expect(page.getByText("Le Comptoir").nth(1)).toBeVisible({ timeout: 30_000 })   // en-tête + bloc d'identité
  await expect(page.getByText("The Alchemist")).toHaveCount(0)
  await expect(page.getByText("Mojito").first()).toBeVisible()

  await page.locator("button", { hasText: "🚀" }).first().click()
  const feuille = page.getByRole("dialog", { name: "Publier la page" })
  await expect(feuille).toBeVisible()
  await expect(feuille).toContainText("créez votre compte gratuit")
  // L'accroche d'exemple du modèle est signalée avant de partir en ligne.
  await expect(feuille.getByTestId("publish-warning").filter({ hasText: "Cocktails d'auteur" })).toBeVisible()
  await expect(feuille.getByRole("button", { name: "Réduit" })).toHaveCount(0)
  await expect(feuille).not.toContainText(/\d+ blocs?/)
  await expect(feuille.getByRole("link", { name: /Ouvrir la page/ })).toHaveCount(0)
})
