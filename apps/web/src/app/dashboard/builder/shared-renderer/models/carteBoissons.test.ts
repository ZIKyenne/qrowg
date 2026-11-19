import { describe, it, expect } from "vitest"
import { boissons, rubriques, colonnes, SANS_RUBRIQUE } from "./carteBoissons"

const carte = {
  b1_name: "Saint-Joseph", b1_type: "Rouges", b1_origin: "Vallée du Rhône", b1_detail: "Syrah", b1_p1: "7 €", b1_p2: "34 €", b1_badge: "Coup de cœur",
  b2_name: "Chablis", b2_type: "Blancs", b2_p1: "8 €", b2_p2: "38 €",
  b3_name: "Limonade maison", b3_p1: "4 €", b3_badge: "Mystère",                   // sans rubrique, badge hors liste
  b4_name: "Côtes-du-Rhône", b4_type: "Rouges", b4_p1: "5 €",
  b5_name: "   ", b5_p1: "3 €",
  b6_name: "Spritz", b6_type: "Cocktails", b6_detail: "Apérol, prosecco — 11 % vol.", b6_p1: "9 €",
}

describe("la carte des boissons", () => {
  const liste = boissons(carte)
  it("lit les boissons ; une ligne sans nom n'en est pas une ; badge hors liste ignoré", () => {
    expect(liste.map(b => b.nom)).toEqual(["Saint-Joseph", "Chablis", "Limonade maison", "Côtes-du-Rhône", "Spritz"])
    expect(liste[0].badge).toBe("Coup de cœur")
    expect(liste[2].badge).toBeNull()
  })
  it("rubriques dans l'ordre de saisie, « Boissons » en dernier ; deux prix seulement si l'un en a deux", () => {
    const r = rubriques(liste)
    expect(r.map(x => x.nom)).toEqual(["Rouges", "Blancs", "Cocktails", SANS_RUBRIQUE])
    expect(r[0].boissons.map(b => b.nom)).toEqual(["Saint-Joseph", "Côtes-du-Rhône"])
    expect(r.map(x => x.deuxPrix)).toEqual([true, true, false, false])
  })
  it("les colonnes portent les noms du commerçant", () => {
    expect(colonnes({})).toEqual(["Verre", "Bouteille"])
    expect(colonnes({ col1: "25 cl", col2: "50 cl" })).toEqual(["25 cl", "50 cl"])
  })
})
