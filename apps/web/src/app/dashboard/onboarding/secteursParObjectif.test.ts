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
    // U3 (23 nov.) : plus de « Le Comptoir — … » inventé par le secteur.
    expect(r.templateName).toBe("Ma page — Présenter un menu")
    expect(r.blocks.find(b => b.type === "profile")!.content.name).toBe("")
    expect((r.theme as any).name).toBe("Nuit Cocktail")
  })
})

describe("le nom du commerce vient du commerçant (U3)", () => {
  const menu = OBJECTIVES.find(o => o.key === "menu")!
  const bar = SECTORS.find(s => s.key === "bar")
  it("saisi, il fait le titre et le nom en tête de page", () => {
    const r = composeRecipe(menu, bar, "  Chez Nénette ")
    expect(r.templateName).toBe("Chez Nénette")
    expect(r.blocks.find(b => b.type === "profile")!.content.name).toBe("Chez Nénette")
  })
  it("vide, aucun nom n'est inventé, avec ou sans secteur", () => {
    for (const o of OBJECTIVES) for (const s of [undefined, ...SECTORS]) {
      const r = composeRecipe(o, s, "   ")
      expect(r.templateName, `${o.key} × ${s?.key}`).toBe(`Ma page — ${o.label}`)
    }
    expect(SECTORS.every(s => !("name" in s))).toBe(true)
  })
  it("ne touche pas aux recettes partagées", () => {
    composeRecipe(menu, bar, "Chez Nénette")
    expect(menu.blocks.find(b => b.type === "profile")?.content.name ?? "").toBe("")
  })
  it("l'écran demande le nom avant le secteur", () => {
    const c = require("node:fs").readFileSync(require("node:path").join(__dirname, "OnboardingClient.tsx"), "utf8")
    expect(c).toContain('label="Nom de votre commerce"')
    expect(c).toContain("composeRecipe(o, s, nom)")
  })
})
