import { describe, it, expect } from "vitest"
import { produitsDeLaCarte } from "./carteIllustree"
import {
  languesCochees, lireTraduction, traduireProduits, couverture, langueDuVisiteur, demandeDeTraduction,
  LIBELLES, LANGUES_PROPOSEES,
} from "./traductionCarte"
import { BADGES_DE_CARTE } from "./carteIllustree"

const carte = {
  p1_name: "Sandwich grec", p1_price: "8,50 €", p1_cat: "Sandwiches", p1_desc: "Viande grillée, salade",
  p2_name: "Frites maison", p2_price: "3 €", p2_cat: "Accompagnements",
  p3_name: "Tiramisu", p3_price: "4 €", p3_cat: "Desserts",
}
const produits = produitsDeLaCarte(carte)

describe("la carte traduite", () => {
  it("les langues cochées, dans l'ordre de la liste, sans code inconnu", () => {
    expect(languesCochees({ langues: "ar, en,xx" })).toEqual(["en", "ar"])
    expect(languesCochees({})).toEqual([])
  })

  it("rattachée au NOM français : l'ordre de la réponse ne compte pas", () => {
    const t = lireTraduction("Frites maison ; Homemade fries\n# Sandwiches ; Sandwiches\nsandwich grec | Greek sandwich | Grilled meat, salad\n\nligne bancale")
    const en = traduireProduits(produits, t)
    expect(en.map(p => p.nom)).toEqual(["Greek sandwich", "Homemade fries", "Tiramisu"])   // non traduit : reste en français
    expect(en[0].description).toBe("Grilled meat, salad")
    expect(en[1].categorie).toBe("Accompagnements")                                        // catégorie non traduite
    expect(en[0].prix).toBe("8,50 €")                                                       // le prix ne bouge pas
  })

  it("l'éditeur sait ce qui manque", () => {
    const t = lireTraduction("Sandwich grec ; Greek sandwich")
    expect(couverture(produits, t)).toEqual({ traduits: 1, total: 3, manquants: ["Frites maison", "Tiramisu"] })
  })

  it("la langue du téléphone, si elle est proposée ; sinon le français", () => {
    expect(langueDuVisiteur(["ar-MA", "fr"], ["en", "ar"])).toBe("ar")
    expect(langueDuVisiteur(["fr-FR", "en"], ["en"])).toBe("fr")
    expect(langueDuVisiteur(["de-DE"], ["en"])).toBe("fr")
  })

  it("la demande contient toute la carte et le format exigé", () => {
    const d = demandeDeTraduction(produits, "en")
    expect(d).toContain("en anglais")
    expect(d).toContain("# Sandwiches")
    expect(d).toContain("Sandwich grec ; Viande grillée, salade")
    expect(d).toContain("Nom en français ; Nom traduit ; Description traduite")
  })

  it("chaque langue proposée a TOUS ses libellés et ses badges ; l'arabe se lit de droite à gauche", () => {
    for (const l of ["fr", ...LANGUES_PROPOSEES] as const) {
      const L = LIBELLES[l]
      for (const b of BADGES_DE_CARTE) expect(L.badges[b], `${l} ${b}`).toBeTruthy()
      expect(L.aucun("x"), l).toContain("x")
      expect(L.produits(2), l).toContain("2")
    }
    expect(LIBELLES.ar.dir).toBe("rtl")
  })
})
