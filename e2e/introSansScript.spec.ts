import { test, expect } from "@playwright/test"

// Garde (20 nov.) — l'animation d'entrée ne cache pas la page pour toujours.
// Mesuré en production : sans JavaScript, une page avec intro (the-red-fish)
// restait sur son écran-logo, son menu pourtant présent dans le HTML. Sur une
// 4G qui traîne, c'était plusieurs secondes de logo ; sans script, l'infini.
// Banc : la vraie page publiée, `?intro=1` allume l'intro.

const BANC = "/e2e-harness/public-page?intro=1"

test.describe("sans JavaScript", () => {
  test.use({ javaScriptEnabled: false })
  test("l'écran-logo s'efface seul, le contenu se voit", async ({ page }) => {
    await page.goto(BANC, { waitUntil: "load", timeout: 120_000 })
    const couverture = page.locator(".couverture-intro")
    await expect(couverture).toBeVisible()
    await expect(couverture).toBeHidden({ timeout: 8_000 })
  })
})

test("avec JavaScript : l'intro se joue toujours, puis la page", async ({ page }) => {
  await page.goto(BANC, { waitUntil: "networkidle", timeout: 120_000 })
  // Le JavaScript retire l'écran serveur bien avant le filet de 5 s.
  await expect(page.locator(".couverture-intro")).toHaveCount(0, { timeout: 4_000 })
})
