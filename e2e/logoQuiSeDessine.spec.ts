import { test, expect } from "@playwright/test"

// Relevé en production le 18 nov. (studio QR, compte réel) : avec un logo,
// l'aperçu restait un carré vide et « Télécharger » ne produisait rien.
// Cause : qr-code-styling relisait le logo par XMLHttpRequest (saveAsBlob), la
// CSP `connect-src` refusait, et la bibliothèque attendait pour toujours.
// Le banc sert la même CSP que la production (next.config.mjs).

test("un QR avec logo se dessine, et se télécharge", async ({ page }, info) => {
  await page.goto("/e2e-harness/qr-studio?plan=pro&logo=1", { waitUntil: "networkidle" })
  if (info.project.name === "mobile") await page.getByRole("button", { name: /Carte restaurant \(démo\)/ }).first().click()

  // L'aperçu porte des pixels sombres (les modules), pas un carré vide.
  const canvas = page.locator("canvas").first()
  await expect(canvas).toBeVisible()
  await expect.poll(async () => canvas.evaluate((c: HTMLCanvasElement) => {
    const ctx = c.getContext("2d")
    if (!ctx || !c.width) return 0
    const d = ctx.getImageData(0, 0, c.width, c.height).data
    let sombres = 0
    for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 200 && d[i] < 80 && d[i + 1] < 80 && d[i + 2] < 80) sombres++
    return sombres
  }), { timeout: 10000, message: "l'aperçu du QR avec logo reste vide" }).toBeGreaterThan(500)
  await page.screenshot({ path: `test-results/logo-apercu-${info.project.name}.png` })

  if (info.project.name === "desktop") {
    await page.getByRole("button", { name: "Télécharger" }).click()
    const dl = page.waitForEvent("download", { timeout: 20000 })
    await page.getByRole("button", { name: /^PNG Web/ }).click()
    expect((await dl).suggestedFilename()).toMatch(/\.png$/)
  }
})
