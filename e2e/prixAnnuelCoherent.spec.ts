import { test, expect, type Page } from "@playwright/test"

// ═══════════════════════════════════════════════════════════════════════════════
// Q06 — DEUX PAGES, DEUX FACTURES ANNUELLES.
//
// Le 29 septembre, l'accueil annonçait « 149,04 € / an » et la page d'abonnement
// « 149 € / an » pour le plan Établissement ; « 489,96 € » contre « 490 € » pour
// Multi-sites. Les deux reconstruisaient la facture en multipliant par douze un
// équivalent mensuel arrondi, avec deux arrondis d'affichage différents.
//
// Ce que ce fichier mesure : les deux écrans, à l'écran, l'un après l'autre.
// ═══════════════════════════════════════════════════════════════════════════════

/** Les montants « … € / an » lisibles sur la page, dans l'ordre. */
async function totauxAnnuels(page: Page): Promise<string[]> {
  const texte = (await page.locator("body").innerText()).replace(/ /g, " ")
  return [...texte.matchAll(/([\d  ]+(?:,\d+)?)\s*€\s*\/\s*an/g)].map(m => m[1].replace(/\s/g, "").trim())
}

async function passerEnAnnuel(page: Page, libelle: RegExp) {
  const bascule = page.getByRole("switch", { name: libelle })
  await expect(bascule).toBeVisible({ timeout: 30_000 })
  await bascule.scrollIntoViewIfNeeded()
  // Ces pages sont rendues côté serveur puis hydratées : un clic posé trop tôt
  // atteint un bouton qui n'écoute pas encore. On réessaie plutôt que de
  // supposer un défaut du produit.
  await expect.poll(async () => {
    if ((await bascule.getAttribute("aria-checked")) !== "true") await bascule.click()
    return bascule.getAttribute("aria-checked")
  }, { timeout: 30_000 }).toBe("true")
}

test.describe("Q06 — un seul montant annuel", () => {
  test("l'accueil et la page d'abonnement facturent la même chose", async ({ page }, testInfo) => {
    await page.goto("/", { waitUntil: "domcontentloaded" })
    await page.getByRole("switch", { name: /facturation annuelle/i }).scrollIntoViewIfNeeded()
    await passerEnAnnuel(page, /facturation annuelle/i)
    const accueil = await totauxAnnuels(page)
    await testInfo.attach(`q06-accueil-${testInfo.project.name}`, { body: await page.screenshot(), contentType: "image/png" })

    await page.goto("/upgrade", { waitUntil: "domcontentloaded" })
    await passerEnAnnuel(page, /facturation annuelle/i)
    const abonnement = await totauxAnnuels(page)
    await testInfo.attach(`q06-upgrade-${testInfo.project.name}`, { body: await page.screenshot(), contentType: "image/png" })

    expect(accueil.length, "aucun total annuel lisible sur l'accueil").toBeGreaterThan(0)
    expect(abonnement.length, "aucun total annuel lisible sur l'abonnement").toBeGreaterThan(0)

    // Les montants facturés, et eux seuls.
    expect(accueil).toContain("149")
    expect(accueil).toContain("490")
    expect(abonnement).toContain("149")
    expect(abonnement).toContain("490")

    // Et surtout : plus aucune reconstruction. 149,04 et 489,96 n'existent plus.
    for (const liste of [accueil, abonnement]) {
      expect(liste).not.toContain("149,04")
      expect(liste).not.toContain("489,96")
    }
    expect(new Set(accueil), "les deux écrans n'annoncent pas les mêmes totaux").toEqual(new Set(abonnement))
  })

  test("la remise annoncée est celle qu'on obtient vraiment", async ({ page }) => {
    await page.goto("/upgrade", { waitUntil: "domcontentloaded" })
    await passerEnAnnuel(page, /facturation annuelle/i)
    const texte = (await page.locator("body").innerText()).replace(/ /g, " ")

    // 19 € × 12 − 149 € = 79 €, soit 34 %. Le badge disait « -20 % » pour tous.
    expect(texte).toContain("34 %")
    expect(texte).toMatch(/vous économisez 79 €/)
    expect(texte).toMatch(/vous économisez 98 €/)
    expect(texte, "le pourcentage écrit à la main est revenu").not.toContain("-20%")
  })

  test("l'accueil ne promet plus deux mois quand il en offre quatre", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" })
    await page.getByRole("switch", { name: /facturation annuelle/i }).scrollIntoViewIfNeeded()
    const texte = (await page.locator("body").innerText()).replace(/ /g, " ")
    expect(texte).not.toContain("Jusqu'à 2 mois offerts")
    expect(texte).toMatch(/Jusqu'à 4 mois offerts/)
  })
})
