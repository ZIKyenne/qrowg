import { describe, it, expect } from "vitest"
import { slugifyBase, slugifyUnique } from "./slug"

describe("slugifyBase", () => {
  it("minuscule + espaces/symboles -> tirets", () => {
    expect(slugifyBase("Le Bistrot Parisien")).toBe("le-bistrot-parisien")
    expect(slugifyBase("Menu du Jour !")).toBe("menu-du-jour")
  })
  it("retire les accents", () => {
    expect(slugifyBase("Crêperie Amélie")).toBe("creperie-amelie")
    expect(slugifyBase("Château & Cie")).toBe("chateau-cie")
  })
  it("condense les separateurs et coupe les tirets de bord", () => {
    expect(slugifyBase("  --Hello___World--  ")).toBe("hello-world")
    expect(slugifyBase("a   b")).toBe("a-b")
  })
  it("borne la longueur (defaut 50)", () => {
    expect(slugifyBase("a".repeat(80)).length).toBe(50)
    expect(slugifyBase("a".repeat(80), 60).length).toBe(60)
  })
  it("entree vide / non slugifiable -> chaine vide", () => {
    expect(slugifyBase("")).toBe("")
    expect(slugifyBase(undefined)).toBe("")
    expect(slugifyBase("!!!")).toBe("")
    expect(slugifyBase("café")).toBe("cafe")
  })
  it("conserve chiffres et lettres", () => {
    expect(slugifyBase("Table 42 - Zone B")).toBe("table-42-zone-b")
  })
})

describe("slugifyUnique", () => {
  const RE = /^[a-z0-9-]+-[a-z0-9]{6}$/
  it("produit base-slug + suffixe de 6 caracteres", () => {
    const s = slugifyUnique("Le Bistrot Parisien")
    expect(s).toMatch(RE)
    expect(s.startsWith("le-bistrot-parisien-")).toBe(true)
  })
  it("repli 'page' si base vide ou trop courte", () => {
    expect(slugifyUnique("!!!")).toMatch(/^page-[a-z0-9]{6}$/)
    expect(slugifyUnique("")).toMatch(/^page-[a-z0-9]{6}$/)
    expect(slugifyUnique(undefined)).toMatch(/^page-[a-z0-9]{6}$/)
    expect(slugifyUnique("a")).toMatch(/^page-[a-z0-9]{6}$/) // 1 car < 2 -> repli
  })
  it("respecte la contrainte de longueur (2..60)", () => {
    const s = slugifyUnique("x".repeat(100))
    expect(s.length).toBeGreaterThanOrEqual(2)
    expect(s.length).toBeLessThanOrEqual(60)
    expect(s).toMatch(RE)
  })
  it("deux appels donnent des slugs distincts (suffixe aleatoire)", () => {
    expect(slugifyUnique("meme-titre")).not.toBe(slugifyUnique("meme-titre"))
  })
})
