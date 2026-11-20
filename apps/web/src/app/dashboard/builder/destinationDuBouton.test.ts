import { describe, it, expect } from "vitest"
import { ecrireDestination, lireDestination, saisieApresChangement, SORTES_DE_DESTINATION } from "./destinationDuBouton"
import { destinationUtile } from "./types"

describe("écrire la destination d'un bouton", () => {
  it("appel : le numéro comme on l'écrit devient un tel: appelable", () => {
    expect(ecrireDestination("appel", "06 12 34 56 78")).toBe("tel:0612345678")
    expect(ecrireDestination("appel", "+33 6 12 34 56 78")).toBe("tel:+33612345678")
  })
  it("WhatsApp : sans le 0, sans le +, indicatif français par défaut", () => {
    expect(ecrireDestination("whatsapp", "06 12 34 56 78")).toBe("https://wa.me/33612345678")
    expect(ecrireDestination("whatsapp", "+32 470 12 34 56")).toBe("https://wa.me/32470123456")
  })
  it("e-mail : mailto:, et rien tant que l'adresse ne tient pas", () => {
    expect(ecrireDestination("email", " contact@resto.fr ")).toBe("mailto:contact@resto.fr")
    expect(ecrireDestination("email", "contact@")).toBe("")
    expect(ecrireDestination("email", "a@b.fr?bcc=x@y.fr")).toBe("")
  })
  it("site : gardé tel quel", () => {
    expect(ecrireDestination("site", "monresto.fr")).toBe("monresto.fr")
  })
  it("rien de saisi : rien d'enregistré (le bouton reste annoncé sans destination)", () => {
    for (const s of SORTES_DE_DESTINATION) expect(ecrireDestination(s.id, "  ")).toBe("")
  })
  it("chaque destination fabriquée passe la règle de publication", () => {
    for (const [sorte, saisie] of [["appel", "06 12 34 56 78"], ["whatsapp", "0612345678"], ["email", "a@b.fr"], ["site", "monresto.fr"]] as const)
      expect(destinationUtile(ecrireDestination(sorte, saisie)), sorte).not.toBeNull()
  })
})

describe("relire un lien enregistré", () => {
  it("reconnaît chaque sorte", () => {
    expect(lireDestination("tel:0612345678")).toEqual({ sorte: "appel", saisie: "0612345678" })
    expect(lireDestination("https://wa.me/33612345678?text=Bonjour")).toEqual({ sorte: "whatsapp", saisie: "+33612345678" })
    expect(lireDestination("mailto:a@b.fr?subject=x")).toEqual({ sorte: "email", saisie: "a@b.fr" })
    expect(lireDestination("https://monresto.fr")).toEqual({ sorte: "site", saisie: "https://monresto.fr" })
  })
  it("« # » des modèles et vide : site, champ vide", () => {
    expect(lireDestination("#")).toEqual({ sorte: "site", saisie: "" })
    expect(lireDestination(undefined)).toEqual({ sorte: "site", saisie: "" })
  })
  it("aller-retour stable", () => {
    for (const [sorte, saisie] of [["appel", "0612345678"], ["whatsapp", "+33612345678"], ["email", "a@b.fr"], ["site", "https://x.fr"]] as const) {
      const lu = lireDestination(ecrireDestination(sorte, saisie))
      expect(lu.sorte).toBe(sorte)
      expect(ecrireDestination(lu.sorte, lu.saisie)).toBe(ecrireDestination(sorte, saisie))
    }
  })
})

describe("changer de sorte", () => {
  it("garde le numéro entre Appel et WhatsApp, repart de zéro ailleurs", () => {
    expect(saisieApresChangement("appel", "whatsapp", "0612")).toBe("0612")
    expect(saisieApresChangement("appel", "email", "0612")).toBe("")
    expect(saisieApresChangement("site", "appel", "x.fr")).toBe("")
  })
})
