import { test, expect, type Page } from "@playwright/test"
import { PLAN_LIST } from "../apps/web/src/lib/plans"
import { economieAnnuelle, remiseMaxPourcent, moisOffertsMax } from "../apps/web/src/lib/tarifs"

// ═══════════════════════════════════════════════════════════════════════════════
// Q06 — DEUX PAGES, DEUX FACTURES ANNUELLES.
//
// Le 29 septembre, l'accueil annonçait « 149,04 € / an » et la page d'abonnement
// « 149 € / an » pour la même formule : les deux reconstruisaient la facture en
// multipliant par douze un équivalent mensuel arrondi.
//
// Ce fichier recopiait ensuite les montants de cette grille-là (149, 490, « 34 % »,
// « 4 mois »). La grille a changé le 11 novembre, et les tests ont échoué sur des
// prix qui n'existaient plus (revue du 17 novembre). Les attendus se LISENT
// maintenant dans lib/plans et lib/tarifs : le test mesure la cohérence des deux
// écrans avec ce qui est facturé, quel que soit le prix du jour.
// ═══════════════════════════════════════════════════════════════════════════════

const PAYANTS = PLAN_LIST.filter(p => p.priceAnnualTotal > 0)
/** « 118,80 » ou « 118 » : le total annuel tel que les écrans l'écrivent (sans espace). */
const ecrit = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2).replace(".", ","))
const euros = (n: number) => ecrit(Math.round(n * 100) / 100)

/** Les montants « … € / an » lisibles sur la page, dans l'ordre. */
async function totauxAnnuels(page: Page): Promise<string[]> {
  const texte = (await page.locator("body").innerText()).replace(/ /g, " ")
  return [...texte.matchAll(/([\d  ]+(?:,\d+)?)\s*€\s*\/\s*an/g)].map(m => m[1].replace(/\s/g, "").trim())
}

async function passerEnAnnuel(page: Page, libelle: RegExp) {
  const bascule = page.getByRole("switch", { name: libelle })
  await expect(bascule).toBeVisible({ timeout: 30_000 })
  await bascule.scrollIntoViewIfNeeded()
  // Pages rendues côté serveur puis hydratées : on réessaie le clic plutôt que
  // de supposer un défaut du produit.
  await expect.poll(async () => {
    if ((await bascule.getAttribute("aria-checked")) !== "true") await bascule.click()
    return bascule.getAttribute("aria-checked")
  }, { timeout: 30_000 }).toBe("true")
}

test.describe("Q06 — un seul montant annuel", () => {
  test("l'accueil et la page d'abonnement facturent la même chose, celle de lib/plans", async ({ page }, testInfo) => {
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
    // Chaque total facturé par Stripe (priceAnnualTotal) est écrit, tel quel, sur les deux écrans.
    for (const p of PAYANTS) {
      expect(accueil, `${p.label} sur l'accueil`).toContain(euros(p.priceAnnualTotal))
      expect(abonnement, `${p.label} sur /upgrade`).toContain(euros(p.priceAnnualTotal))
    }
    expect(new Set(accueil), "les deux écrans n'annoncent pas les mêmes totaux").toEqual(new Set(abonnement))
  })

  test("la remise annoncée est celle qu'on obtient vraiment", async ({ page }) => {
    await page.goto("/upgrade", { waitUntil: "domcontentloaded" })
    await passerEnAnnuel(page, /facturation annuelle/i)
    const texte = (await page.locator("body").innerText()).replace(/ /g, " ")
    expect(texte).toContain(`${remiseMaxPourcent(PLAN_LIST)} %`)
    for (const p of PAYANTS) {
      expect(texte, p.label).toContain(`vous économisez ${euros(economieAnnuelle(p.priceMonthly, p.priceAnnualTotal))} €`)
    }
    expect(texte, "le pourcentage écrit à la main est revenu").not.toContain("-20%")
  })

  test("l'accueil annonce les mois offerts que la grille offre vraiment", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" })
    await page.getByRole("switch", { name: /facturation annuelle/i }).scrollIntoViewIfNeeded()
    const texte = (await page.locator("body").innerText()).replace(/ /g, " ")
    const mois = moisOffertsMax(PLAN_LIST)
    expect(texte).toContain(mois > 0 ? `Jusqu'à ${mois} mois offerts` : `Jusqu'à −${remiseMaxPourcent(PLAN_LIST)} %`)
  })
})
