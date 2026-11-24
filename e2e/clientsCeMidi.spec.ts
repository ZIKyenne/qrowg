import { test, expect } from "@playwright/test"

// Vague 3, point 5 (revue du 23 nov.) : « combien de clients ce midi, par
// support ? » — une carte, à l'heure du commerce, sans compter deux fois.

test("onglet Supports : les clients du service de midi, par support", async ({ page }, info) => {
  await page.goto("/e2e-harness/statistiques", { waitUntil: "networkidle" })
  await page.getByRole("tab", { name: "Supports" }).or(page.getByRole("button", { name: "Supports", exact: true })).first().click()
  const carte = page.getByRole("region", { name: "Le service de midi, par support" })
  await expect(carte).toBeVisible({ timeout: 20_000 })
  // 5 scans : « a » deux fois et sur un seul support, b, c, d → 4 clients ; le sticker en a 3.
  await expect(carte).toContainText(/(Ce|Hier) midi, entre 11 h et 15 h : 4 clients\./)
  await expect(carte.getByRole("listitem").first()).toContainText("Sticker de table (démo)")
  await expect(carte.getByRole("listitem").first()).toContainText("3 clients")
  await carte.screenshot({ path: `test-results/clients-ce-midi-${info.project.name}.png` })
})

test("sans empreinte anonyme : la carte compte des scans, et le dit", async ({ page }) => {
  await page.goto("/e2e-harness/statistiques?midi=scans", { waitUntil: "networkidle" })
  await page.getByRole("tab", { name: "Supports" }).or(page.getByRole("button", { name: "Supports", exact: true })).first().click()
  const carte = page.getByRole("region", { name: "Le service de midi, par support" })
  await expect(carte).toContainText(/: 5 scans\./, { timeout: 20_000 })
  await expect(carte).toContainText("un client qui scanne deux fois compte deux fois")
})
