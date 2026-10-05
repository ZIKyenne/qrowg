import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import {
  auCentime, mensuelEquivalent, totalMensualise, economieAnnuelle,
  remisePourcent, moisOfferts, remiseMaxPourcent, moisOffertsMax, fmtEuros,
} from "./tarifs"
import { PLAN_LIST, PLANS } from "./plans"

const read = (p: string) => readFileSync(join(__dirname, p), "utf8")

// ═══════════════════════════════════════════════════════════════════════════════
// Q06 — DEUX PAGES, DEUX FACTURES ANNUELLES.
//
// Constat du 29 septembre : l'accueil affichait « 149,04 € / an » et la page
// d'abonnement « 149 € / an » pour le plan Établissement. Les deux calculaient la
// même chose de la même façon — douze fois un équivalent mensuel arrondi — avec
// deux arrondis d'affichage différents. Et aucune ne donnait la facture : elle
// vaut 149 €.
//
// La règle tenue ici : **le montant stocké est celui qui sera facturé.** On en
// déduit l'équivalent mensuel pour l'affichage, jamais l'inverse.
// ═══════════════════════════════════════════════════════════════════════════════

describe("Q06 — le sens de lecture est le bon", () => {
  it("l'équivalent mensuel se déduit du total annuel", () => {
    expect(mensuelEquivalent(149)).toBe(12.42)
    expect(mensuelEquivalent(490)).toBe(40.83)
    expect(mensuelEquivalent(0)).toBe(0)
  })

  it("et ne permet PAS de remonter à la facture — c'est tout le défaut", () => {
    // 12,42 × 12 = 149,04. Le test dit à voix haute pourquoi ce chemin est interdit.
    expect(auCentime(mensuelEquivalent(149) * 12)).toBe(149.04)
    expect(auCentime(mensuelEquivalent(149) * 12)).not.toBe(149)
  })

  it("les deux plans payants portent la facture qu'ils annoncent", () => {
    expect(PLANS.pro.priceAnnualTotal).toBe(149)
    expect(PLANS.business.priceAnnualTotal).toBe(490)
    expect(PLANS.free.priceAnnualTotal).toBe(0)
  })

  it("aucun plan ne peut voir ses deux prix diverger : l'un dérive de l'autre", () => {
    for (const p of PLAN_LIST) {
      expect(p.priceAnnual, p.id).toBe(mensuelEquivalent(p.priceAnnualTotal))
      expect(p.priceAnnual, `${p.id} : l'annuel devrait rester sous le mensuel`).toBeLessThanOrEqual(p.priceMonthly)
    }
  })
})

describe("Q06 — les remises sont calculées, plus annoncées", () => {
  it("l'économie annuelle vaut douze mensualités moins la facture", () => {
    expect(economieAnnuelle(19, 149)).toBe(79)
    expect(economieAnnuelle(49, 490)).toBe(98)
    expect(totalMensualise(19)).toBe(228)
  })

  it("la remise réelle n'a jamais valu 20 % — ni pour l'un, ni pour l'autre", () => {
    expect(remisePourcent(19, 149)).toBe(34)   // l'audit mesurait 34,65 %
    expect(remisePourcent(49, 490)).toBe(16)   // l'audit mesurait 16,67 %
    expect(remiseMaxPourcent(PLAN_LIST)).toBe(34)
  })

  it("elle s'arrondit vers le bas : on ne promet pas plus qu'on ne tient", () => {
    expect(remisePourcent(10, 109)).toBe(9)    // 9,16 % réels
    expect(remisePourcent(100, 1000)).toBe(16) // 16,66 % réels
  })

  it("les mois offerts se comptent aussi — « 2 » en annonçait moins que la réalité", () => {
    expect(moisOfferts(19, 149)).toBe(4)       // 79 € / 19 € = 4,1 mois
    expect(moisOfferts(49, 490)).toBe(2)
    expect(moisOffertsMax(PLAN_LIST)).toBe(4)
  })

  it("un plan gratuit ne tire pas la grille vers le bas", () => {
    expect(remisePourcent(0, 0)).toBe(0)
    expect(moisOfferts(0, 0)).toBe(0)
    expect(remiseMaxPourcent([{ priceMonthly: 0, priceAnnualTotal: 0 }, { priceMonthly: 19, priceAnnualTotal: 149 }])).toBe(34)
  })

  it("une offre annuelle plus chère que le mensuel n'invente pas une remise négative", () => {
    expect(economieAnnuelle(10, 200)).toBe(0)
    expect(remisePourcent(10, 200)).toBe(0)
    expect(moisOfferts(10, 200)).toBe(0)
  })
})

describe("Q06 — un total s'écrit comme sur une facture", () => {
  it("sans centimes quand il n'y en a pas", () => {
    expect(fmtEuros(149)).toBe("149")
    expect(fmtEuros(490)).toBe("490")
  })
  it("avec eux quand il y en a", () => {
    expect(fmtEuros(149.5)).toBe("149,5")
    expect(fmtEuros(12.42)).toBe("12,42")
  })
  it("et jamais « 149,04 » pour une facture de 149 €", () => {
    expect(fmtEuros(PLANS.pro.priceAnnualTotal)).not.toContain("04")
  })
})

// ── Les écrans lisent la facture, ils ne la refabriquent pas ───────────────
describe("Q06 — aucun écran ne reconstruit un total annuel", () => {
  const ECRANS: [string, string][] = [
    ["accueil", "../app/homeSections/Pricing.tsx"],
    ["abonnement", "../app/upgrade/page.tsx"],
  ]

  for (const [nom, f] of ECRANS) {
    it(`${nom} : plus aucune multiplication par douze`, () => {
      const src = read(f)
      expect(src, `${nom} refabrique encore la facture`).not.toContain("rawAnnual * 12")
      expect(src, `${nom} ne lit pas le montant facturé`).toContain("totalAnnuel")
    })
  }

  it("les deux écrans écrivent donc le même total pour le même plan", () => {
    // Ils lisent tous deux `priceAnnualTotal` et le formatent avec `fmtEuros` :
    // la même donnée et le même formateur ne peuvent pas donner deux nombres.
    for (const [, f] of ECRANS) {
      expect(read(f)).toContain("fmtEuros(plan.totalAnnuel)")
    }
  })

  it("plus de pourcentage de remise écrit à la main", () => {
    const upgrade = read("../app/upgrade/page.tsx")
    expect(upgrade, "le badge « -20 % » est revenu").not.toContain(">-20%<")
    expect(upgrade).toContain("const REMISE_MAX = remiseMaxPourcent(PLAN_LIST)")
    const accueil = read("../app/homeSections/Pricing.tsx")
    expect(accueil, "« 2 mois offerts » était écrit en dur, et faux").not.toContain("Jusqu'à 2 mois offerts")
    expect(accueil).toContain("const MOIS_OFFERTS = moisOffertsMax(PLAN_LIST)")
  })

  it("le récapitulatif envoyé par courriel donne le montant ET la période", () => {
    // Il annonçait « 12,42 €/mois » à quelqu'un dont la banque affichera 149 €.
    const mail = read("./subscriptionEmail.ts")
    expect(mail).toContain("fmtEuros(p.priceAnnualTotal)")
    expect(mail).toContain('const periode = annuel ? "an" : "mois"')
    expect(mail, "la période était figée au mois").not.toContain("€/mois</strong>, sauf annulation")
  })

  it("le profil dit ce qui sera prélevé, pas seulement l'équivalent mensuel", () => {
    expect(read("../app/dashboard/profile/page.tsx")).toContain("prélevés une fois par an")
  })
})
