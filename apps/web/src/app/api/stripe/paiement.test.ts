import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

const lire = (p: string) => readFileSync(join(__dirname, p), "utf8")
const checkout = lire("checkout/route.ts")
const upgrade = lire("../../upgrade/page.tsx")

// Le chemin du paiement est le seul endroit où de l'argent change de mains.
//
// JOUÉ depuis v407 par bancCaisse.test.ts, sur la vraie route : l'identité vient
// de la session (jamais du corps), rien ne part sans connexion, le plan voyage
// dans les métadonnées de l'abonnement, un tarif non configuré (503) n'est pas
// un plan inexistant (400), l'annuel sans prix annuel est refusé au lieu de
// facturer le mois, aucun essai, adresse de facturation et n° de TVA recueillis,
// `customer_update` pour un client connu. Restent ici l'écran et une garde de
// structure.

describe("quand le paiement ne peut pas démarrer, ça se voit", () => {
  it("le bouton d'abonnement affiche l'erreur au lieu de tourner dans le vide", () => {
    expect(upgrade).toContain("onError=")
    expect(upgrade).toContain("setPayErr(")
    expect(upgrade).toContain("CheckoutErrorBanner")
  })

  it("et il remonte le message du serveur, pas un texte générique", () => {
    expect(upgrade).toContain('throw new Error(data.error || "Le paiement n\'a pas pu démarrer. Réessayez.")')
  })
})

describe("un seul tunnel de paiement", () => {
  it("il n'y a plus qu'une caisse", () => {
    // Un second existait pour l'abonnement « QR Dynamique », avec ses propres
    // paliers « Pro » et « Business » à d'autres prix.
    expect(checkout).not.toContain('product === "dynamic"')
    expect((checkout.match(/stripe\.checkout\.sessions\.create/g) || []).length).toBe(1)
  })
})
