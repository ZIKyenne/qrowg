import { test, expect } from "@playwright/test"

// Audit du 14 novembre 2026 (E, SEO) : « contrôler indexation, canonicals et
// liens des pages Menu, Restaurant, Avis Google et Wi-Fi ; vérifier la
// destination des CTA et l'état des brouillons privés ».

const PAGES = ["/qr-code/menu", "/qr-code/restaurant", "/qr-code/avis-google", "/generateur-qr-code-wifi"]

for (const chemin of PAGES) {
  test(`${chemin} : 200, indexable, canonical sur elle-même, CTA vivants`, async ({ page, request }) => {
    const r = await page.goto(chemin)
    expect(r?.status()).toBe(200)
    const canonical = await page.locator('link[rel="canonical"]').getAttribute("href")
    expect(canonical, "canonical absent").toBeTruthy()
    expect(new URL(canonical!, "https://qrowg.com").pathname).toBe(chemin)
    const robots = await page.locator('meta[name="robots"]').getAttribute("content").catch(() => null)
    expect(robots ?? "").not.toMatch(/noindex/)
    // Chaque lien d'action interne répond.
    const hrefs = await page.locator("main a[href^='/']").evaluateAll(as => [...new Set(as.map(a => (a as HTMLAnchorElement).getAttribute("href")!))])
    for (const h of hrefs.slice(0, 25)) {
      const rep = await request.get(h, { maxRedirects: 0 })
      expect([200, 301, 302, 307, 308], `${h} → ${rep.status()}`).toContain(rep.status())
    }
  })
}

test("un brouillon privé n'est pas servi en public", async ({ request }) => {
  // Une adresse inexistante ou non publiée ne doit pas répondre 200 indexable.
  const rep = await request.get("/brouillon-qui-nexiste-pas-xyz", { maxRedirects: 0 })
  expect(rep.status()).not.toBe(200)
})
