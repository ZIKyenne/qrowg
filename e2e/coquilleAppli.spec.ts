import { test, expect } from "@playwright/test"

// Lot 1 « appli » (18 nov.) : ce qu'on attend d'une appli, mesuré dans un vrai
// navigateur — sur le banc qui monte les crochets de lib/coquilleAppli et
// lib/useFermetureModale (la coquille complète exige une session).

test("revenir sur la liste rouvre là où on était", async ({ page }) => {
  await page.goto("/e2e-harness/coquille/liste", { waitUntil: "networkidle" })
  const zone = page.getByTestId("zone")
  await page.getByRole("link", { name: "Ouvrir la page 40" }).scrollIntoViewIfNeeded()
  const avant = await zone.evaluate(el => el.scrollTop)
  expect(avant).toBeGreaterThan(500)
  await page.waitForTimeout(300) // la position se note après un court répit
  await page.getByRole("link", { name: "Ouvrir la page 40" }).click()
  await expect(page.getByRole("heading", { level: 1, name: "Une page (démo)" })).toBeVisible()
  // Un nouvel écran s'ouvre en haut.
  expect(await page.getByTestId("zone").evaluate(el => el.scrollTop)).toBe(0)
  await page.goBack()
  await expect(page.getByRole("heading", { level: 1, name: "Mes pages (démo)" })).toBeAttached()
  await expect.poll(() => page.getByTestId("zone").evaluate(el => el.scrollTop)).toBeGreaterThan(avant - 10)
})

test("le titre remonte dans la barre quand le grand titre sort de l'écran", async ({ page }) => {
  await page.goto("/e2e-harness/coquille/liste", { waitUntil: "networkidle" })
  await expect(page.getByTestId("barre-titre")).toHaveText("QRowg")
  await page.getByTestId("zone").evaluate(el => { el.scrollTop = 600 })
  await expect(page.getByTestId("barre-titre")).toHaveText("Mes pages (démo)")
  await page.getByTestId("zone").evaluate(el => { el.scrollTop = 0 })
  await expect(page.getByTestId("barre-titre")).toHaveText("QRowg")
})

test("le bouton retour ferme la couche, sans quitter l'écran", async ({ page }) => {
  await page.goto("/e2e-harness/coquille/detail", { waitUntil: "networkidle" })
  await page.goto("/e2e-harness/coquille/liste", { waitUntil: "networkidle" })
  await page.getByRole("button", { name: "Ouvrir une couche" }).click()
  await expect(page.getByRole("dialog", { name: "Couche de démonstration" })).toBeVisible()
  await page.goBack()
  await expect(page.getByRole("dialog")).toHaveCount(0)
  expect(new URL(page.url()).pathname).toBe("/e2e-harness/coquille/liste")
  // Et le retour suivant quitte bien l'écran : aucune entrée fantôme.
  await page.goBack()
  await expect.poll(() => new URL(page.url()).pathname).toBe("/e2e-harness/coquille/detail")
})
