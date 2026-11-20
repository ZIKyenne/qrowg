import { test, expect } from "@playwright/test"
import { collect, problems } from "./helpers/collect"

// 20 nov. — la page publiée est en cache 60 s : le HTML est rendu à une heure,
// hydraté à une autre. Les blocs « du moment » (ici les fournées) se calent sur
// l'INSTANT DU RENDU au premier rendu client, puis sur l'heure réelle.
// On l'éprouve au pire : l'horloge du navigateur figée à des heures du serveur.
// Avant le correctif : « Hydration failed » et la page refaite côté client.

test("une page aux blocs « du moment » s'hydrate sans mismatch, même à une autre heure", async ({ page }) => {
  const c = collect(page)
  await page.clock.setFixedTime(new Date("2026-11-19T10:30:00Z"))   // 11 h 30 à Paris, dans le navigateur
  await page.goto("/e2e-harness/public-page?t=proxi_boulangerie", { waitUntil: "networkidle", timeout: 120_000 })
  const b = page.locator("[data-fournees]")
  // Monté, le bloc suit l'heure du NAVIGATEUR : 7 h et 11 h sorties, la prochaine à 16 h 30.
  await expect(b.locator("[data-prochaine]")).toHaveText(/Prochaine fournée à 16h30 · Viennoiseries — dans 5 h/)
  await expect(b.locator('li[data-sortie="oui"]')).toHaveCount(2)
  expect(problems(c).filter(p => /hydrat|418|did(n.t| not) match/i.test(p)), "mismatch d'hydratation").toEqual([])
})
