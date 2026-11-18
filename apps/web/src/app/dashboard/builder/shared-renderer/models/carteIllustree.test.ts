import { describe, it, expect } from "vitest"
import {
  produitsDeLaCarte, categoriesDeLaCarte, produitsParCategorie, chercherDansLaCarte,
  lireSupplements, lireAllergenes, badgeConnu, ancreDeCategorie, aUneFiche, SANS_CATEGORIE,
  BADGES_DE_CARTE, STYLE_DES_BADGES,
} from "./carteIllustree"

const carte = {
  p1_name: "Sandwich grec", p1_price: "8,50 €", p1_cat: "Sandwiches", p1_badge: "N°1 des ventes",
  p1_desc: "Viande grecque maison, crudités", p1_extras: "Fromage 1€, Frites dedans 1,50 €, Sauce blanche",
  p1_allergens: "gluten, lait, Lait",
  p2_name: "Cheeseburger", p2_price: "5,50 €", p2_cat: "Burgers",
  p3_name: "  ", p3_price: "3 €",                       // prix seul : pas un produit
  p4_name: "Assiette grecque", p4_price: "14 €", p4_cat: "Assiettes", p4_badge: "Super promo", // badge hors liste
  p5_name: "Tacos", p5_price: "9 €", p5_cat: "Sandwiches", p5_badge: "Épicé",
  p6_name: "Baklava", p6_price: "3,50 €",               // sans catégorie
  p7_name: "Frites", p7_price: "3 €", p7_cat: "Accompagnements",
}

describe("la carte illustrée", () => {
  const produits = produitsDeLaCarte(carte)

  it("lit les produits ; une ligne sans nom n'en est pas un", () => {
    expect(produits.map(p => p.nom)).toEqual(["Sandwich grec", "Cheeseburger", "Assiette grecque", "Tacos", "Baklava", "Frites"])
    expect(produits[0].rang).toBe(1)
  })

  it("n'affiche que les badges de la liste (pas d'étiquette inventée)", () => {
    expect(produits.find(p => p.nom === "Assiette grecque")!.badge).toBeNull()
    expect(produits[0].badge).toBe("N°1 des ventes")
    expect(badgeConnu(" Épicé ")).toBe("Épicé")
    for (const b of BADGES_DE_CARTE) expect(STYLE_DES_BADGES[b], b).toBeTruthy()
  })

  it("catégories dans l'ordre de la saisie, avec leur compte ; « Autres » en dernier", () => {
    expect(categoriesDeLaCarte(produits)).toEqual([
      { nom: "Sandwiches", compte: 2 }, { nom: "Burgers", compte: 1 }, { nom: "Assiettes", compte: 1 },
      { nom: "Accompagnements", compte: 1 }, { nom: SANS_CATEGORIE, compte: 1 },
    ])
    const groupes = produitsParCategorie(produits)
    expect(groupes[0].produits.map(p => p.nom)).toEqual(["Sandwich grec", "Tacos"])
    expect(groupes.at(-1)!.produits.map(p => p.nom)).toEqual(["Baklava"])
  })

  it("suppléments : le prix est le montant final ; sans montant, on n'en invente pas", () => {
    expect(lireSupplements("Fromage 1€, Frites dedans 1,50 €, Sauce blanche")).toEqual([
      { nom: "Fromage", prix: "1€" }, { nom: "Frites dedans", prix: "1,50 €" }, { nom: "Sauce blanche", prix: "" },
    ])
    expect(lireSupplements("Coca 33cl 2€")).toEqual([{ nom: "Coca 33cl", prix: "2€" }])
    expect(lireSupplements("7 Up")).toEqual([{ nom: "7 Up", prix: "" }])
    expect(lireSupplements("Bacon : +1,5")).toEqual([{ nom: "Bacon", prix: "+1,5" }])
    expect(lireSupplements("   ")).toEqual([])
  })

  it("allergènes : tels que saisis, sans doublon", () => {
    expect(lireAllergenes("gluten, lait, Lait ; œuf")).toEqual(["gluten", "lait", "œuf"])
    expect(produits[0].allergenes).toEqual(["gluten", "lait"])
  })

  it("la recherche ignore accents et casse, et fouille aussi les suppléments", () => {
    expect(chercherDansLaCarte(produits, "assiette").map(p => p.nom)).toEqual(["Assiette grecque"])
    expect(chercherDansLaCarte(produits, "grecque").map(p => p.nom)).toEqual(["Sandwich grec", "Assiette grecque"]) // via la description
    expect(chercherDansLaCarte(produits, "EPICE").map(p => p.nom)).toEqual(["Tacos"])
    expect(chercherDansLaCarte(produits, "fromage").map(p => p.nom)).toEqual(["Sandwich grec"])
    expect(chercherDansLaCarte(produits, "")).toHaveLength(6)
    expect(chercherDansLaCarte(produits, "pizza")).toEqual([])
  })

  it("une ancre stable et lisible par catégorie", () => {
    expect(ancreDeCategorie("b1", "Entrées & Boissons")).toBe("carte-b1-entrees-boissons")
    expect(ancreDeCategorie("b1", "!!!")).toBe("carte-b1-autres")
  })

  it("la fiche ne s'ouvre que s'il y a plus à montrer que la ligne", () => {
    expect(aUneFiche(produits[0])).toBe(true)    // suppléments + allergènes
    expect(aUneFiche(produits[1])).toBe(false)   // nom + prix seulement
  })
})
