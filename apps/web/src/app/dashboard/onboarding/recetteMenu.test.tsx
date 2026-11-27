import { describe, it, expect } from "vitest"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { OBJECTIVES, composeRecipe } from "./objectives"
import { aUneCarte, carteDeLaPage } from "../builder/shared-renderer/models/epuises"
import { menuTabsViewModel } from "../builder/shared-renderer/models/menuTabs"
import { menuSectionViewModel } from "../builder/shared-renderer/models/menuSection"
import { carteVideARemplir, avecLaCarteCollee } from "../builder/shared-renderer/models/lectureDeCarte"
import { PublicMenuTabs } from "../builder/shared-renderer/blocks/menu_tabs/PublicMenuTabs"
import { hasPublishableContent } from "../builder/blockEmptyState"
import { sansCommentaires } from "@/lib/codeSeul"

// Vague 1, point 2 (revue du 23 nov.) : la recette « menu » arrivait avec
// « Entrée du jour · — · À compléter ». Elle arrive avec des rubriques VIDES,
// et la création mène dans Ma carte pour les remplir.

const menu = OBJECTIVES.find(o => o.key === "menu")!
const carte = () => composeRecipe(menu).blocks.find(b => b.type === "menu_tabs")!

describe("la recette « menu » n'invente aucun plat", () => {
  it("plus de « — » ni de « À compléter », plus de plat d'exemple", () => {
    const tout = JSON.stringify(composeRecipe(menu).blocks)
    expect(tout).not.toMatch(/À compléter|"—"|Entrée du jour|Plat signature|Dessert maison/)
    expect(composeRecipe(menu).blocks.some(b => b.type === "menu_section")).toBe(false)
  })
  it("une carte aux trois rubriques titrées, vides, que Ma carte propose de remplir", () => {
    expect(aUneCarte(composeRecipe(menu).blocks)).toBe(true)
    const rubriques = carteDeLaPage([{ id: "c", type: "menu_tabs", content: carte().content }], { section: menuSectionViewModel, onglets: menuTabsViewModel })
    expect(rubriques.map(r => [r.titre, r.plats.length])).toEqual([["Notre carte · Entrées", 0], ["Notre carte · Plats", 0], ["Notre carte · Desserts", 0]])
  })
  it("une carte collée à la création prend sa place", () => {
    const blocs = avecLaCarteCollee(composeRecipe(menu).blocks, [{ titre: "Cocktails", produits: [{ nom: "Mojito", prix: "10€", desc: "" }] }])
    const cartes = blocs.filter(b => b.type === "menu_tabs")
    expect(cartes).toHaveLength(1)
    expect(cartes[0].content.sec1_title).toBe("Cocktails")
  })
})

describe("en ligne, une rubrique vide ne se montre pas", () => {
  const ctx = { G: "#C9A84C", TEXT: "#111", MUTED: "#555", FONT_D: "serif", FONT_B: "sans-serif" }
  const rendu = (content: Record<string, any>) => renderToStaticMarkup(createElement(PublicMenuTabs, { content, ctx } as never))
  it("une carte sans aucun produit n'est rien sur la page publique", () => {
    expect(rendu(carte().content)).toBe("")
    expect(hasPublishableContent("menu_tabs", carte().content)).toBe(false)
  })
  it("seules les rubriques garnies ont un onglet ; jamais « Aucun produit dans cette section »", () => {
    const html = rendu({ ...carte().content, menu_collapsible: "Non", sec2_items: "Blanquette;14 €" })
    expect(html).toContain("Plats")
    expect(html).not.toContain("Entrées")
    expect(html).not.toContain("Aucun produit")
    expect(hasPublishableContent("menu_tabs", { ...carte().content, sec2_items: "Blanquette;14 €" })).toBe(true)
  })
  it("dans l'éditeur et Ma carte, les rubriques vides restent (c'est là qu'on les remplit)", () => {
    expect(menuTabsViewModel(carte().content).sections).toHaveLength(3)
    expect(menuTabsViewModel(carte().content).enLigne).toHaveLength(0)
  })
})

describe("« Coller ma carte » remplit la carte vide", () => {
  const compter = (c: Record<string, any>) => menuTabsViewModel(c).totalItems
  it("la carte vide de la recette est choisie ; une carte garnie ne l'est jamais", () => {
    expect(carteVideARemplir([{ id: "p", type: "profile", content: {} }, { id: "c", type: "menu_tabs", content: carte().content }], compter)).toBe("c")
    expect(carteVideARemplir([{ id: "c", type: "menu_tabs", content: { sec1_title: "Bières", sec1_items: "IPA;6 €" } }], compter)).toBeNull()
    expect(carteVideARemplir([{ id: "s", type: "menu_section", content: {} }], compter)).toBeNull()
  })
  // L'action serveur remplit la carte vide au lieu d'en ajouter une : JOUÉ depuis
  // v404 (pages/[id]/carte/bancMaCarte.test.ts).
  it("la création mène dans Ma carte", () => {
    const lire = (p: string) => sansCommentaires(readFileSync(join(__dirname, p), "utf8"))
    expect(lire("OnboardingClient.tsx")).toContain("`/dashboard/pages/${d.pageId}/carte`")
  })
})
