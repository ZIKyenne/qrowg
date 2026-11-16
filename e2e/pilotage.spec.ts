import { test, expect } from "@playwright/test"

// Pilotage (audit F), banc à données fictives : l'entonnoir s'affiche, sans débordement.
test("pilotage : entonnoir, rétention, revenu, non mesuré", async ({ page }, info) => {
  await page.goto("/e2e-harness/pilotage")
  await expect(page.getByRole("heading", { level: 1, name: "Pilotage" })).toBeVisible()
  await expect(page.getByRole("row", { name: /Compte créé/ })).toContainText("14")
  await expect(page.getByRole("row", { name: /Première page créée/ })).toContainText("%")
  await expect(page.getByText("Non mesuré ici")).toBeVisible()
  const deborde = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)
  expect(deborde).toBe(false)
  await page.screenshot({ path: `test-results/pilotage-${info.project.name}.png`, fullPage: true })
})
