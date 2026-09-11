import { describe, it, expect } from "vitest"
import { raisonDeProposer, accrocheOffre, avantagesEnPlus, SEUIL_OFFRE } from "./offreUtile"
import { PLANS } from "@/lib/plans"

describe("l'offre ne promet que ce qu'elle apporte", () => {
  it("les vues ne sont un avantage d'aucun plan : les trois les ont illimitées", () => {
    expect(PLANS.free.limits.views).toBeNull()
    expect(PLANS.pro.limits.views).toBeNull()
    for (const p of ["pro", "business"] as const)
      expect(avantagesEnPlus("free", p).join(" · "), p).not.toMatch(/vue/i)
  })
  it("gratuit → pro : les vraies différences, tirées de plans.ts", () => {
    const a = avantagesEnPlus("free", "pro")
    expect(a).toContain("10 pages")
    expect(a).toContain("30 QR codes")
    expect(a).toContain("sans la mention QRowg")
    expect(a).toContain("atelier d'impression")
    expect(a.length).toBeGreaterThan(4)
  })
  it("un plan vers lui-même n'apporte rien", () => {
    expect(avantagesEnPlus("pro", "pro")).toEqual([])
  })
  it("on ne vend jamais à l'envers : passer de business à pro n'ajoute rien", () => {
    expect(avantagesEnPlus("business", "pro").join(" · ")).not.toMatch(/illimité/)
  })
  it("pro → business : l'illimité et l'équipe, pas ce qui est déjà acquis", () => {
    const a = avantagesEnPlus("pro", "business")
    expect(a.join(" · ")).toMatch(/illimité/)
    expect(a).toContain("5 places d'équipe")
    expect(a.join(" · ")).not.toContain("atelier d'impression")   // déjà dans Pro
  })
})

describe("l'offre attend d'avoir une raison", () => {
  it("le cas relevé : une page, trois scans, aucune raison de demander de l'argent", () => {
    expect(raisonDeProposer({ plan: "free", pages: 1, scans: 3 })).toBeNull()
  })
  it("occuper sa limite n'est pas y buter : une page sur un plan à une page ne déclenche rien", () => {
    const max = PLANS.free.limits.pages!
    expect(raisonDeProposer({ plan: "free", pages: max, scans: 0 })).toBeNull()
  })
  it("en détenir plus que le plan n'en garde en ligne, si : là le compte est bloqué", () => {
    const max = PLANS.free.limits.pages!
    expect(raisonDeProposer({ plan: "free", pages: max + 1, scans: 0 })).toBe("limite_pages")
  })
  it("un QR qui tourne en est une", () => {
    expect(raisonDeProposer({ plan: "free", pages: 1, scans: SEUIL_OFFRE - 1 })).toBeNull()
    expect(raisonDeProposer({ plan: "free", pages: 1, scans: SEUIL_OFFRE })).toBe("trafic")
  })
  it("un compte payant n'est jamais relancé", () => {
    expect(raisonDeProposer({ plan: "pro", pages: 99, scans: 9999 })).toBeNull()
    expect(raisonDeProposer({ plan: "business", pages: 99, scans: 9999 })).toBeNull()
  })
  it("l'accroche dit pourquoi on en parle, pas « passez à Pro »", () => {
    expect(accrocheOffre("limite_pages")).toContain("plus de pages que votre plan gratuit")
    expect(accrocheOffre("trafic")).toContain("Votre QR tourne")
    expect(accrocheOffre(null)).toBeNull()
    for (const r of ["limite_pages", "trafic"] as const)
      expect(accrocheOffre(r)!).not.toMatch(/^Passez à/)
  })
})
