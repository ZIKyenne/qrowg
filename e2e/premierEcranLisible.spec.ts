import { test, expect } from "@playwright/test"

// Relevé UX du 16 novembre : deux premiers écrans abîmés sur téléphone.
//  · Accueil : le titre commençait SOUS l'en-tête fixe (« Changez ce que » coupé).
//  · Statistiques : le choix de période sortait de l'écran (« 90j » coupé) —
//    les actions de PageHeader ne passaient pas à la ligne.

test("accueil : le titre commence sous l'en-tête fixe", async ({ page }) => {
  await page.goto("/")
  await page.locator("h1").first().waitFor()
  const r = await page.evaluate(() => {
    const nav = [...document.querySelectorAll("nav")].find(e => getComputedStyle(e).position === "fixed")
    return { h1: document.querySelector("h1")!.getBoundingClientRect().top, nav: nav ? nav.getBoundingClientRect().bottom : 0 }
  })
  expect(r.h1).toBeGreaterThan(r.nav)
})

test("statistiques : la période tient dans l'écran", async ({ page }) => {
  await page.goto("/e2e-harness/statistiques")
  const groupe = page.locator('[role="group"][aria-label="Période"]')
  await groupe.waitFor()
  const r = await groupe.evaluate(g => ({ droite: g.getBoundingClientRect().right, largeur: innerWidth, defile: document.documentElement.scrollWidth }))
  expect(r.droite).toBeLessThanOrEqual(r.largeur)
  expect(r.defile).toBeLessThanOrEqual(r.largeur)
})

test("atelier d'impression : sur téléphone, le premier support avant les filtres", async ({ page }, info) => {
  await page.goto("/e2e-harness/print-studio")
  if (info.project.name !== "mobile") {
    await expect(page.getByRole("button", { name: "Restaurant" })).toBeVisible()
    return
  }
  const filtres = page.getByRole("button", { name: /^Filtres/ })
  await expect(filtres).toHaveAttribute("aria-expanded", "false")
  await expect(page.getByRole("button", { name: "Restaurant" })).toHaveCount(0)
  // Le premier support commence dans le premier écran.
  const carte = page.locator(".ps2-card").first()
  const haut = await carte.evaluate(c => c.getBoundingClientRect().top)
  expect(haut).toBeLessThan(page.viewportSize()!.height)
  await filtres.click()
  await page.getByRole("button", { name: "Restaurant" }).click()
  await expect(page.getByRole("button", { name: /^Fermer · 1/ })).toBeVisible()
})
