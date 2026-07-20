import { describe, it, expect } from "vitest"
import {
  PAGE_TEMPLATES, PAGE_TEMPLATE_GROUPS, AMBIANCE_THEMES, AMBIANCE_KEYS, themeForAmbiance,
} from "./page-templates"

describe("themeForAmbiance", () => {
  it("cle connue -> son theme", () => {
    expect(themeForAmbiance("velvet")).toBe(AMBIANCE_THEMES.velvet)
    expect(themeForAmbiance("gold")).toBe(AMBIANCE_THEMES.gold)
  })
  it("cle inconnue / vide -> repli sur gold", () => {
    expect(themeForAmbiance("inexistant")).toBe(AMBIANCE_THEMES.gold)
    expect(themeForAmbiance("")).toBe(AMBIANCE_THEMES.gold)
  })
  it("chaque cle d'ambiance donne un theme nomme", () => {
    for (const k of AMBIANCE_KEYS) {
      const th = themeForAmbiance(k) as { name?: string }
      expect(th).toBeTruthy()
      expect(th.name).toBeTruthy()
    }
  })
  it("AMBIANCE_KEYS reflete les cles des themes et contient gold", () => {
    expect(AMBIANCE_KEYS).toEqual(Object.keys(AMBIANCE_THEMES))
    expect(AMBIANCE_KEYS).toContain("gold")
  })
})

describe("PAGE_TEMPLATE_GROUPS", () => {
  it("liste des groupes distincts, sans doublon", () => {
    expect(PAGE_TEMPLATE_GROUPS.length).toBeGreaterThan(0)
    expect(new Set(PAGE_TEMPLATE_GROUPS).size).toBe(PAGE_TEMPLATE_GROUPS.length)
  })
  it("couvre exactement les groupes presents dans les modeles", () => {
    const fromData = new Set(PAGE_TEMPLATES.map(t => t.group))
    expect(new Set(PAGE_TEMPLATE_GROUPS)).toEqual(fromData)
  })
  it("preserve l'ordre de premiere apparition", () => {
    const seen: string[] = []
    for (const t of PAGE_TEMPLATES) if (!seen.includes(t.group)) seen.push(t.group)
    expect(PAGE_TEMPLATE_GROUPS).toEqual(seen)
  })
})

// Invariants structurels : un modele casse (cle dupliquee, blocs vides, theme
// manquant) briserait l'application du modele en runtime. Ces tests l'attrapent.
describe("integrite des PAGE_TEMPLATES", () => {
  it("au moins un modele", () => {
    expect(PAGE_TEMPLATES.length).toBeGreaterThan(0)
  })
  it("cles uniques (pas de collision dans le selecteur)", () => {
    const keys = PAGE_TEMPLATES.map(t => t.key)
    expect(new Set(keys).size).toBe(keys.length)
  })
  it("champs d'affichage renseignes", () => {
    for (const t of PAGE_TEMPLATES) {
      expect(t.key, `key manquante`).toBeTruthy()
      expect(t.group, `group manquant sur ${t.key}`).toBeTruthy()
      expect(t.label, `label manquant sur ${t.key}`).toBeTruthy()
      expect(t.emoji, `emoji manquant sur ${t.key}`).toBeTruthy()
      expect(t.desc, `desc manquante sur ${t.key}`).toBeTruthy()
    }
  })
  it("chaque modele a un theme et au moins un bloc valide", () => {
    for (const t of PAGE_TEMPLATES) {
      expect(t.theme, `theme manquant sur ${t.key}`).toBeTruthy()
      expect(Array.isArray(t.blocks)).toBe(true)
      expect(t.blocks.length, `aucun bloc sur ${t.key}`).toBeGreaterThan(0)
      for (const b of t.blocks) {
        expect(typeof b.type, `type de bloc invalide sur ${t.key}`).toBe("string")
        expect(b.type.length).toBeGreaterThan(0)
        expect(b.content && typeof b.content === "object", `content invalide sur ${t.key}`).toBe(true)
      }
    }
  })
})
