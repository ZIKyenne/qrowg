import { describe, it, expect } from "vitest"
import { contraste, surFond, versRvb, luminance, encreSur, ENCRE_SOMBRE, ENCRE_CLAIRE, CONTRASTE_MIN } from "./couleurLisible"

// Les trois cas relevés le 11 septembre sur les pages de démonstration.
const MENTHE = "#F2FAF8"   // fond du modèle « Cabinet & praticien »
const NOIR = "#080808"     // fond des modèles sombres
const VERT_OUVERT = "#39FF8F"
const OR = "#C9A84C"

describe("le rapport de contraste, mesuré et pas estimé", () => {
  it("noir sur blanc vaut 21, une couleur sur elle-même vaut 1", () => {
    expect(contraste("#000000", "#FFFFFF")).toBeCloseTo(21, 1)
    expect(contraste("#C9A84C", "#C9A84C")).toBeCloseTo(1, 5)
  })
  it("il est symétrique, et il lit les formats courts", () => {
    expect(contraste("#fff", "#000")).toBeCloseTo(contraste("#000", "#fff")!, 6)
    expect(versRvb("#fff")).toEqual([255, 255, 255])
    expect(versRvb("#39FF8F")).toEqual([57, 255, 143])
  })
  it("une entrée qui n'est pas une couleur ne casse rien", () => {
    expect(contraste("var(--accent)", "#000")).toBeNull()
    expect(versRvb("rgb(1,2,3)")).toBeNull()
    expect(surFond("var(--accent)", MENTHE)).toBe("var(--accent)")
  })
  it("le cas relevé : le badge « Ouvert » était à 1,1 sur fond menthe", () => {
    expect(contraste(VERT_OUVERT, MENTHE)!).toBeLessThan(1.3)
    expect(contraste(OR, "#FFF8F0")!).toBeLessThan(2.2)
  })
})

describe("une couleur de sens garde son sens et devient lisible", () => {
  it("le vert « ouvert » s'assombrit sur fond clair jusqu'à passer le seuil", () => {
    const v = surFond(VERT_OUVERT, MENTHE)
    expect(contraste(v, MENTHE)!).toBeGreaterThanOrEqual(CONTRASTE_MIN)
    // toujours du vert : le canal vert reste dominant
    const [r, g, b] = versRvb(v)!
    expect(g).toBeGreaterThan(r)
    expect(g).toBeGreaterThan(b)
    expect(v).not.toBe("#000000")
  })
  it("sur le fond noir du produit, elle n'est pas touchée", () => {
    expect(surFond(VERT_OUVERT, NOIR)).toBe(VERT_OUVERT)
    expect(surFond(OR, NOIR)).toBe(OR)
  })
  it("le rouge « fermé » reste rouge, l'or reste doré", () => {
    const rouge = surFond("#EF4444", MENTHE)
    const [r, g, b] = versRvb(rouge)!
    expect(r).toBeGreaterThan(g)
    expect(r).toBeGreaterThan(b)
    const or = surFond(OR, "#FFF8F0")
    const [r2, g2, b2] = versRvb(or)!
    expect(r2).toBeGreaterThan(b2)
    expect(g2).toBeGreaterThan(b2)
  })
  it("ce qui est déjà lisible n'est pas retouché : le thème du client reste le sien", () => {
    expect(surFond("#12756A", MENTHE)).toBe("#12756A")
    expect(surFond("#000000", "#FFFFFF")).toBe("#000000")
  })
  it("une teinte impossible finit au noir ou au blanc, jamais illisible", () => {
    const jaune = surFond("#FFFF00", "#FFFFFF")
    expect(contraste(jaune, "#FFFFFF")!).toBeGreaterThanOrEqual(CONTRASTE_MIN)
  })
  it("un seuil plus bas suffit pour une pastille non textuelle", () => {
    const v = surFond(VERT_OUVERT, MENTHE, 3)
    expect(contraste(v, MENTHE)!).toBeGreaterThanOrEqual(3)
    expect(luminance(versRvb(v)!)).toBeLessThan(luminance(versRvb(VERT_OUVERT)!))
  })
})

describe("l'encre posée sur une couleur est choisie, pas supposée blanche", () => {
  it("le cas relevé : la terracotta du modèle Pizzeria prend une encre sombre", () => {
    const TERRACOTTA = "#E2603F"
    expect(contraste(ENCRE_CLAIRE, TERRACOTTA)!).toBeLessThan(CONTRASTE_MIN)
    expect(encreSur(TERRACOTTA)).toBe(ENCRE_SOMBRE)
    expect(contraste(encreSur(TERRACOTTA), TERRACOTTA)!).toBeGreaterThan(CONTRASTE_MIN)
  })
  it("sur une couleur sombre, elle reste claire", () => {
    expect(encreSur("#12756A")).toBe(ENCRE_CLAIRE)
    expect(encreSur("#080808")).toBe(ENCRE_CLAIRE)
  })
  it("elle choisit toujours le meilleur des deux, jamais le pire", () => {
    for (const f of ["#FFFFFF", "#000000", "#C9A84C", "#39FF8F", "#7476F2", "#EC4899"]) {
      const e = encreSur(f)
      const autre = e === ENCRE_SOMBRE ? ENCRE_CLAIRE : ENCRE_SOMBRE
      expect(contraste(e, f)!, f).toBeGreaterThanOrEqual(contraste(autre, f)!)
    }
  })
  it("une entrée qui n'est pas une couleur ne casse rien", () => {
    expect(encreSur("var(--accent)")).toBe(ENCRE_CLAIRE)
  })
})
