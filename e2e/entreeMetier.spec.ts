import { test, expect } from "@playwright/test"

// Audit du 14 novembre 2026 (D1) : « Composer ma page » depuis une page métier
// menait à /creer, filtre « Tous 48 », Freelance / Consultant en tête. Le métier
// doit suivre le visiteur jusqu'à la galerie.

for (const [usage, rayon, attendu] of [
  ["restaurant", "Restaurant", /Bistrot|Restaurant/],
  ["bar", "Bar", /Bar à cocktails|Bar de nuit/],
  ["menu", "Restaurant", /Bistrot|Restaurant/],
] as const) {
  test(`/qr-code/${usage} → galerie filtrée sur ${rayon}`, async ({ page }) => {
    await page.goto(`/qr-code/${usage}`)
    const cta = page.getByRole("link", { name: /^Composer ma page/ }).first()
    await expect(cta).toHaveAttribute("href", new RegExp(`metier=${rayon}`))
    await cta.click()
    await page.waitForURL(/\/creer/)
    // Choix établi (v202+) : la galerie ne masque rien, elle TRIE — le métier
    // d'abord, puis les autres, avec « Ordre habituel » pour revenir.
    await expect(page.getByText(/d'abord, puis \d+ autres/)).toBeVisible()
    const titres = page.locator('article.tpl-card h2[id^="tpl-nom-"]')
    await expect(titres.first()).toBeVisible()
    const tete = (await titres.allTextContents()).slice(0, 4).join(" | ")
    expect(tete).not.toMatch(/Freelance|Consultant/i)
    expect(tete).toMatch(attendu)
  })
}
