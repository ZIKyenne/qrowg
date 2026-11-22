import { test, expect } from "@playwright/test"

// Passage « client attablé » (22 nov., audit UX v2 — PUB-003, A11Y-008). Les
// neuf modèles bar/resto, rendus comme une page publique (/examples/<clé>), à
// 320 px — la largeur de référence du reflow WCAG : pas de défilement de côté,
// aucune commande sous le minimum WCAG (24 px). Et le bandeau de démonstration
// passe à 44 px sous le doigt (il mesurait 32 px).

const MODELES = ["resto_bistrot", "resto_fastfood", "resto_kebab", "resto_tacos", "resto_pizza", "resto_vins", "resto_brasserie", "resto_pub", "resto_bar"]

test("modèles bar/resto à 320 px : rien ne déborde, tout se touche", async ({ browser }, info) => {
  test.skip(info.project.name !== "desktop", "un seul passage suffit : le contexte est fixé ici")
  test.setTimeout(600_000)
  const ctx = await browser.newContext({ viewport: { width: 320, height: 700 }, hasTouch: true, isMobile: true })
  const page = await ctx.newPage()
  for (const m of MODELES) {
    await page.goto("/examples/" + m, { waitUntil: "networkidle", timeout: 180_000 })
    const r = await page.evaluate(() => {
      const cibles = [...document.querySelectorAll("a,button,[role=button],[role=tab],summary")].filter(e => {
        const b = e.getBoundingClientRect(); const s = getComputedStyle(e)
        return b.width > 0 && b.height > 0 && s.visibility !== "hidden" && s.pointerEvents !== "none"
      })
      return {
        largeur: document.documentElement.scrollWidth,
        minuscules: cibles.filter(e => { const b = e.getBoundingClientRect(); return b.height < 24 || b.width < 24 }).map(e => (e.textContent || e.getAttribute("aria-label") || "").trim().slice(0, 30)),
        bandeau: [...document.querySelectorAll(".demo-bandeau a")].map(a => Math.round(a.getBoundingClientRect().height)),
      }
    })
    expect(r.largeur, `${m} : défilement de côté`).toBeLessThanOrEqual(321)
    expect(r.minuscules, `${m} : commandes sous 24 px`).toEqual([])
    for (const h of r.bandeau) expect(h, `${m} : lien du bandeau sous le doigt`).toBeGreaterThanOrEqual(44)
  }
  await ctx.close()
})
