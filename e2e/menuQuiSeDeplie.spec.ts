import { test, expect } from "@playwright/test"
import { connecter } from "./sessionSimulee"

// Retour du 17 nov. : un clic sur « Paramètres » dans la barre latérale menait au
// premier écran (rechargement) et ne montrait les autres qu'une fois arrivé — deux
// gestes. Un groupe à plusieurs écrans se DÉPLIE maintenant sur place ; un groupe
// à un seul écran reste un lien direct.

test("barre latérale : un groupe se déplie sans changer de page", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "barre latérale d'ordinateur")
  await connecter(page, "pro")
  await page.goto("/dashboard/templates", { waitUntil: "networkidle" })
  await expect(page).toHaveURL(/\/dashboard\/templates/)

  const parametres = page.getByRole("button", { name: /^Paramètres/ })
  await expect(parametres).toHaveAttribute("aria-expanded", "false")
  await parametres.click()
  await expect(parametres).toHaveAttribute("aria-expanded", "true")
  await expect(page).toHaveURL(/\/dashboard\/templates/)              // aucune navigation
  await expect(page.getByRole("link", { name: "Sous-domaine" })).toBeVisible()
  await expect(page.getByRole("link", { name: "Domaines" })).toBeVisible()
  await page.screenshot({ path: "test-results/menu-deplie.png", clip: { x: 0, y: 0, width: 260, height: 900 } })

  // « Messages » : une entrée à part, lien direct.
  await expect(page.getByRole("link", { name: /^Messages/ }).first()).toHaveAttribute("href", "/dashboard/leads")
  // Replier.
  await parametres.click()
  await expect(page.getByRole("link", { name: "Sous-domaine" })).toHaveCount(0)
  // Le choix mène bien à l'écran (on lit le lien : l'écran Domaines vérifie la
  // session côté serveur, ce que la session simulée ne peut pas satisfaire).
  await parametres.click()
  await expect(page.getByRole("link", { name: "Domaines", exact: true })).toHaveAttribute("href", "/dashboard/domains")
})
