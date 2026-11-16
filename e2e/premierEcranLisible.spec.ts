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
