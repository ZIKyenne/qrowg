import { describe, it, expect } from "vitest"
import { secteursPour, SECTORS, composeRecipe, OBJECTIVES } from "./objectives"

// Audit du 14 novembre 2026 (D3) : « Présenter un menu » → Beauté, Artisan, Freelance… et pas de Bar.
describe("les secteurs suivent l'objectif", () => {
  it("menu → restaurant et bar, rien d'autre", () => {
    expect(secteursPour("menu").map(s => s.key)).toEqual(["restaurant", "bar"])
  })
  it("un autre objectif garde tous les secteurs, bar compris", () => {
    expect(secteursPour("avis")).toEqual(SECTORS)
    expect(SECTORS.some(s => s.key === "bar")).toBe(true)
  })
  it("menu × bar produit une page Bar au thème cocktail", () => {
    const menu = OBJECTIVES.find(o => o.key === "menu")!
    const r = composeRecipe(menu, SECTORS.find(s => s.key === "bar"))
    expect(r.templateName).toBe("Le Comptoir — Présenter un menu")
    // …mais le nom du secteur n'entre pas dans le profil publié (20 nov.).
    expect(r.blocks.find(b => b.type === "profile")!.content.name).toBe("")
    expect((r.theme as any).name).toBe("Nuit Cocktail")
  })
})
