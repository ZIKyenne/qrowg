import { describe, it, expect } from "vitest"
import { emailPaiementRefuse, emailResiliationProgrammee, emailChangementDeFormule } from "./emailsAbonnement"

describe("les e-mails de la vie d'un abonnement", () => {
  it("paiement refusé : la formule vendue, la conséquence, la carte à mettre à jour", () => {
    const e = emailPaiementRefuse({ nom: "Léa", plan: "pro" })
    expect(e.subject).toContain("paiement")
    expect(e.html).toContain("Établissement")
    expect(e.html).toContain("/dashboard/settings")
    expect(e.html).not.toMatch(/\bPro\b|Business/)
  })
  it("résiliation programmée : la date dite, et comment revenir dessus", () => {
    const e = emailResiliationProgrammee({ plan: "business", finIso: "2026-12-17T10:00:00Z" })
    expect(e.subject).toContain("Multi-sites")
    expect(e.subject).toContain("17 décembre 2026")
    expect(e.html).toContain("Annuler la résiliation")
    expect(emailResiliationProgrammee({ plan: "pro", finIso: null }).subject).toContain("en fin de période")
  })
  it("changement de formule : la montée liste ce qui est débloqué ; la baisse ne vend rien", () => {
    const monte = emailChangementDeFormule({ avant: "starter", apres: "pro" })!
    expect(monte.subject).toContain("Établissement")
    expect(monte.html).toContain("statistiques détaillées")   // un vrai plus d'Établissement sur Starter
    expect(monte.html).not.toContain("Vues illimitées")
    const baisse = emailChangementDeFormule({ avant: "business", apres: "starter" })!
    expect(baisse.subject).toContain("Starter")
    expect(baisse.html).toContain("rien n'est supprimé")
    expect(emailChangementDeFormule({ avant: "pro", apres: "pro" })).toBeNull()
  })
  it("le nom du client est échappé", () => {
    expect(emailPaiementRefuse({ nom: "<script>x</script>", plan: "pro" }).html).not.toContain("<script>x")
  })
})
