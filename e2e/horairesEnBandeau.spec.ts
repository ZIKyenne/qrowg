import { test, expect } from "@playwright/test"

// Lot fast-food 2 (19 nov.) : les horaires en BANDEAU compact, sous le nom du
// commerce — « Ouvert · ferme à 23:00 » d'un coup d'œil, le détail replié.
// Mesuré sur la vraie page d'exemple du modèle « Kebab & Snack ».

test("le statut d'ouverture se lit en haut, et le détail se déplie", async ({ page }) => {
  await page.goto("/examples/resto_kebab", { waitUntil: "networkidle", timeout: 120_000 })
  const bandeau = page.locator("[data-horaires-bandeau]")
  await expect(bandeau).toBeVisible()
  // Le statut est calculé à l'heure du commerce, après le montage.
  await expect(bandeau.locator("[data-statut-ouverture]")).toHaveText(/^(Ouvert|Ferme bientôt|Fermé)/)
  // Il vient AVANT la carte : c'est la première chose qu'on cherche.
  const yBandeau = (await bandeau.boundingBox())!.y
  const yCarte = (await page.locator("[data-carte-illustree]").boundingBox())!.y
  expect(yBandeau).toBeLessThan(yCarte)

  // Replié par défaut ; il se déplie au toucher…
  await expect(bandeau).not.toHaveAttribute("open", "")
  const resume = bandeau.locator("summary")
  expect((await resume.boundingBox())!.height, "cible au doigt").toBeGreaterThanOrEqual(44)
  await resume.click()
  await expect(bandeau).toHaveAttribute("open", "")
  await expect(bandeau.getByText("Lundi — Vendredi")).toBeVisible()
  // …et au clavier.
  await resume.click()
  await resume.focus()
  await page.keyboard.press("Enter")
  await expect(bandeau).toHaveAttribute("open", "")
})
