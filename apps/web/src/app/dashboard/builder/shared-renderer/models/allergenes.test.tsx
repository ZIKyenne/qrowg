import { describe, it, expect } from "vitest"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { ALLERGENES, avecAllergenes, allergenesDuProduit, phraseAllergenes } from "./allergenes"
import { carteDeLaPage } from "./epuises"
import { menuSectionViewModel } from "./menuSection"
import { menuTabsViewModel } from "./menuTabs"
import { rubriquesDesAutresCartes } from "./autresCartes"
import { produitsDeLaCarte } from "./carteIllustree"
import { boissons } from "./carteBoissons"
import { offresHappy } from "./happyHour"
import { MenuItemList } from "../primitives/MenuItemList"

// Vague 2, point 2 (revue du 23 nov.) : les 14 allergènes, sur toutes les cartes.

describe("les 14 allergènes de l'annexe II", () => {
  it("quatorze, dans l'ordre du règlement, sans doublon", () => {
    expect(ALLERGENES).toHaveLength(14)
    expect(new Set(ALLERGENES.map(a => a.code)).size).toBe(14)
    expect(ALLERGENES[0].libelle).toBe("Gluten")
    expect(ALLERGENES[13].libelle).toBe("Mollusques")
  })
})

describe("rangés par produit, comme « épuisé »", () => {
  const menu = { item1_name: "Foie gras", item1_desc: "Brioche", item2_name: "Soupe" }
  it("non renseigné ≠ aucun des 14", () => {
    expect(allergenesDuProduit(menu, "Soupe")).toBeNull()
    const c = avecAllergenes(menu, "Soupe", [])
    expect(allergenesDuProduit(c, "Soupe")).toEqual([])
  })
  it("l'ordre du règlement, sans doublon ni code inconnu, quoi qu'on envoie", () => {
    const c = avecAllergenes(menu, "Foie gras · Brioche", ["lait", "gluten", "lait", "inventé", "oeufs"])
    expect(allergenesDuProduit(c, "Foie gras", "Brioche")).toEqual(["gluten", "oeufs", "lait"])
    expect(phraseAllergenes(allergenesDuProduit(c, "Foie gras", "Brioche"))).toBe("Gluten, Œufs, Lait")
  })
  it("réécrire remplace, effacer rend « non renseigné », les autres produits ne bougent pas", () => {
    let c = avecAllergenes(menu, "Soupe", ["celeri"])
    c = avecAllergenes(c, "Foie gras · Brioche", ["gluten"])
    c = avecAllergenes(c, "Soupe", ["lait"])
    expect(allergenesDuProduit(c, "Soupe")).toEqual(["lait"])
    c = avecAllergenes(c, "soupe", null)
    expect(allergenesDuProduit(c, "Soupe")).toBeNull()
    expect(allergenesDuProduit(c, "Foie gras", "Brioche")).toEqual(["gluten"])
  })
  it("l'identité suit le produit quand l'éditeur réordonne ses lignes", () => {
    const c = avecAllergenes(menu, "Soupe", ["celeri"])
    const reordonne = { ...c, item1_name: "Soupe", item1_desc: "", item2_name: "Foie gras", item2_desc: "Brioche" }
    expect(menuSectionViewModel(reordonne).items.map(i => [i.name, i.allergenes])).toEqual([["Soupe", "Céleri"], ["Foie gras", ""]])
  })
})

describe("ce que Ma carte renseigne, toutes les cartes l'affichent", () => {
  it("menu et grande carte", () => {
    const m = avecAllergenes({ item1_name: "Soupe" }, "Soupe", ["celeri", "lait"])
    expect(menuSectionViewModel(m).items[0].allergenes).toBe("Lait, Céleri")   // ordre du règlement
    const t = avecAllergenes({ sec1_title: "Entrées", sec1_items: "Soupe;7 €;Maison" }, "Soupe · Maison", ["gluten"])
    expect(menuTabsViewModel(t).sections[0].items[0].allergenes).toBe("Gluten")
  })
  it("boissons, happy hour, carte illustrée (avec le texte libre déjà saisi, sans doublon)", () => {
    expect(boissons(avecAllergenes({ b1_name: "Brouilly", b1_detail: "Gamay" }, "Brouilly · Gamay", ["sulfites"]))[0].allergenes).toBe("Sulfites")
    expect(offresHappy(avecAllergenes({ h1_name: "Pinte" }, "Pinte", ["gluten"]))[0].allergenes).toBe("Gluten")
    const ill = avecAllergenes({ p1_name: "Burger", p1_allergens: "gluten, moutarde" }, "Burger", ["gluten", "lait"])
    expect(produitsDeLaCarte(ill)[0].allergenes).toEqual(["gluten", "moutarde", "Lait"])
  })
  it("rendu public : « Allergènes : … » sous le produit, rien s'il n'y a rien", () => {
    const html = renderToStaticMarkup(createElement(MenuItemList, { items: [{ name: "Soupe", price: "7", allergenes: "Céleri, Lait" }, { name: "Salade", price: "6" }], text: "#111", muted: "#555", primary: "#C9A84C" }))
    expect(html).toContain("Allergènes : Céleri, Lait")
    expect((html.match(/Allergènes/g) ?? []).length).toBe(1)
  })
  it("Ma carte voit l'état de chaque produit, sur les cinq blocs", () => {
    const rubriques = carteDeLaPage([
      { id: "m", type: "menu_section", content: avecAllergenes({ item1_name: "Soupe", item2_name: "Salade" }, "Soupe", []), position: 1 },
      { id: "b", type: "carte_boissons", content: avecAllergenes({ b1_name: "Brouilly" }, "Brouilly", ["sulfites"]), position: 2 },
    ], { section: menuSectionViewModel, onglets: menuTabsViewModel, autres: rubriquesDesAutresCartes })
    expect(rubriques.flatMap(r => r.plats.map(p => [p.nom, p.allergenes]))).toEqual([["Soupe", []], ["Salade", null], ["Brouilly", ["sulfites"]]])
  })
})
