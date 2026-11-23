import { describe, it, expect } from "vitest"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { rubriquesDesAutresCartes } from "./autresCartes"
import { carteDeLaPage, avecEpuise, aUneCarte, estEditable } from "./epuises"
import { avecPrix } from "./prixDeLaCarte"
import { menuSectionViewModel } from "./menuSection"
import { menuTabsViewModel } from "./menuTabs"
import { produitsDeLaCarte } from "./carteIllustree"
import { boissons } from "./carteBoissons"
import { offresHappy } from "./happyHour"
import { PublicCarteBoissons } from "../blocks/carte_boissons"
import { PublicHappyHour } from "../blocks/happy_hour"

// Vague 1 (revue du 23 nov.) : la carte illustrée, les boissons et l'happy hour
// entrent dans Ma carte — épuisé et prix, sans l'éditeur. Ce que Ma carte écrit,
// la page publique le lit : même identité (nom · description) des deux côtés.

const ILLUSTREE = { title: "Snack", p1_name: "Burger maison", p1_price: "12 €", p1_desc: "Cheddar", p1_cat: "Burgers", p2_name: "Frites", p2_price: "4 €", p2_cat: "À côté" }
const BOISSONS = { title: "Vins", b1_name: "Côtes-du-Rhône", b1_type: "Rouges", b1_detail: "Grenache", b1_p1: "6 €", b1_p2: "26 €", b2_name: "Pression", b2_type: "Bières", b2_p1: "5 €" }
const HAPPY = { title: "Happy hour", creneau: "17h - 20h", h1_name: "Pinte", h1_normal: "7 €", h1_happy: "5 €" }
const lire = { section: menuSectionViewModel, onglets: menuTabsViewModel, autres: rubriquesDesAutresCartes }
const ctx = { G: "#C9A84C", TEXT: "#111", MUTED: "#555", FONT_D: "serif", FONT_B: "sans-serif", LINE: "#ddd", LINE_STRONG: "#ccc", FILL: "#fff" }

describe("Ma carte lit les trois autres cartes", () => {
  const rubriques = carteDeLaPage([
    { id: "i", type: "carte_illustree", content: ILLUSTREE, position: 1 },
    { id: "b", type: "carte_boissons", content: BOISSONS, position: 2 },
    { id: "h", type: "happy_hour", content: HAPPY, position: 3 },
  ], lire)
  it("une rubrique par catégorie, par rubrique de boissons, et l'happy hour", () => {
    expect(rubriques.map(r => [r.titre, r.plats.map(p => p.nom)])).toEqual([
      ["Snack · Burgers", ["Burger maison"]], ["Snack · À côté", ["Frites"]],
      ["Vins · Rouges", ["Côtes-du-Rhône"]], ["Vins · Bières", ["Pression"]],
      ["Happy hour", ["Pinte"]],
    ])
  })
  it("ni ajout ni correction ici : ces cartes se composent dans l'éditeur", () => {
    expect(rubriques.every(r => r.edition === false)).toBe(true)
    expect(estEditable("menu_tabs") && estEditable("menu_section")).toBe(true)
    expect(estEditable("carte_illustree")).toBe(false)
  })
  it("une boisson à deux prix les montre, mais son prix se change dans l'éditeur", () => {
    const vin = rubriques.find(r => r.titre === "Vins · Rouges")!.plats[0]
    expect([vin.prix, vin.prixModifiable]).toEqual(["6 € / 26 €", false])
    expect(rubriques.find(r => r.titre === "Vins · Bières")!.plats[0].prixModifiable).toBeUndefined()
    expect(rubriques.find(r => r.titre === "Happy hour")!.plats[0].prix).toBe("5 €")
  })
  it("une page qui n'a qu'une carte illustrée a bien « Ma carte »", () => {
    expect(aUneCarte([{ type: "carte_illustree" }])).toBe(true)
  })
})

describe("épuisé dans Ma carte = épuisé sur la page publique", () => {
  it("carte illustrée (nom · description)", () => {
    const c = avecEpuise(ILLUSTREE, "Burger maison · Cheddar", true)
    expect(produitsDeLaCarte(c).map(p => [p.nom, p.epuise])).toEqual([["Burger maison", true], ["Frites", false]])
  })
  it("boissons : barrée, avec la mention", () => {
    const c = avecEpuise(BOISSONS, "Pression", true)
    expect(boissons(c).map(b => b.epuise)).toEqual([false, true])
    const html = renderToStaticMarkup(createElement(PublicCarteBoissons, { content: c, ctx } as never))
    expect(html).toContain("Épuisé")
    expect(html).toMatch(/line-through[^>]*>Pression</)
  })
  it("happy hour", () => {
    const c = avecEpuise(HAPPY, "Pinte", true)
    expect(offresHappy(c)[0].epuise).toBe(true)
    expect(renderToStaticMarkup(createElement(PublicHappyHour, { content: c, ctx } as never))).toContain("Épuisé")
  })
})

describe("changer un prix", () => {
  it("carte illustrée et happy hour : le champ du prix, rien d'autre", () => {
    const a = avecPrix("carte_illustree", ILLUSTREE, "Burger maison · Cheddar", "13 €")
    expect([a.changees, a.content.p1_price, a.content.p2_price]).toEqual([1, "13 €", "4 €"])
    const h = avecPrix("happy_hour", HAPPY, "Pinte", "4,50 €")
    expect([h.changees, h.content.h1_happy, h.content.h1_normal]).toEqual([1, "4,50 €", "7 €"])
  })
  it("boissons : le prix unique change ; deux prix, on ne devine pas lequel", () => {
    expect(avecPrix("carte_boissons", BOISSONS, "Pression", "5,50 €").content.b2_p1).toBe("5,50 €")
    const vin = avecPrix("carte_boissons", BOISSONS, "Côtes-du-Rhône · Grenache", "7 €")
    expect([vin.changees, vin.content.b1_p1]).toEqual([0, "6 €"])
  })
  it("les deux menus d'avant ne changent pas de comportement", () => {
    const m = avecPrix("menu_section", { item1_name: "Mojito", item1_price: "10 €" }, "Mojito", "11 €")
    expect([m.changees, m.content.item1_price]).toEqual([1, "11 €"])
  })
})
