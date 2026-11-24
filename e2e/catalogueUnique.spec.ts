import { test, expect } from "@playwright/test"

// Un seul catalogue de modèles, partout (vague 4, point 5, lot 2 — 24 nov.).
// Les 14 modèles historiques n'existaient que dans la galerie ; /examples et la
// fenêtre « Modèles » de l'éditeur en proposaient 51 sur 65.

test("/examples annonce et liste les 65 modèles", async ({ page }) => {
  await page.goto("/examples", { waitUntil: "networkidle" })
  await expect(page.getByText(/65 modèles/)).toBeVisible()
  await page.screenshot({ path: "test-results/examples-hub.png", fullPage: false })
})

test("un modèle historique a sa page de démonstration, dans son thème", async ({ page }) => {
  const erreurs: string[] = []
  page.on("pageerror", e => erreurs.push(String(e)))
  const rep = await page.goto("/examples/coach", { waitUntil: "networkidle" })
  expect(rep?.status()).toBe(200)
  // Le thème du modèle : fond clair #F5FFF5.
  const fonds = await page.evaluate(() => Array.from(document.querySelectorAll<HTMLElement>("body *")).map(e => getComputedStyle(e).backgroundColor))
  expect(fonds).toContain("rgb(245, 255, 245)")
  // (Le moyen de joindre ajouté au modèle est vérifié par registreDesModeles.test.ts :
  // sans numéro saisi, la démonstration ne publie pas de bouton d'appel.)
  expect(erreurs).toEqual([])
  await page.screenshot({ path: "test-results/examples-coach.png", fullPage: false })
})
