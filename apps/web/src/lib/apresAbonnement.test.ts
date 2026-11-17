import { describe, it, expect } from "vitest"
import { gestesApresAbonnement, phraseAbonnementActif } from "./apresAbonnement"

describe("juste après le paiement : le nom de la formule, et quoi faire", () => {
  it("la phrase nomme la formule vendue, jamais l'identifiant interne", () => {
    expect(phraseAbonnementActif("pro")).toBe("Votre formule Établissement est active.")
    expect(phraseAbonnementActif("business")).toContain("Multi-sites")
  })
  it("les gestes suivent ce que la formule ouvre VRAIMENT", () => {
    const multi = gestesApresAbonnement("business").map(g => g.href)
    expect(multi).toContain("/dashboard/team")
    expect(gestesApresAbonnement("pro").map(g => g.href)).not.toContain("/dashboard/team")
    expect(gestesApresAbonnement("free").map(g => g.href)).not.toContain("/dashboard/domains")
  })
  it("jamais plus de trois gestes", () => {
    for (const p of ["free", "starter", "pro", "business"]) expect(gestesApresAbonnement(p).length).toBeLessThanOrEqual(3)
  })
})
