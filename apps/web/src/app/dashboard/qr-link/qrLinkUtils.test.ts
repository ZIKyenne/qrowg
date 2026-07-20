import { describe, it, expect } from "vitest"
import { lum, contrast, normalizeUrl } from "./qrLinkUtils"

describe("normalizeUrl", () => {
  it("ajoute https:// quand aucun schema", () => {
    expect(normalizeUrl("monsite.fr")).toBe("https://monsite.fr")
    expect(normalizeUrl("instagram.com/moncompte")).toBe("https://instagram.com/moncompte")
  })
  it("laisse intacts les schemas reconnus", () => {
    expect(normalizeUrl("https://x.com")).toBe("https://x.com")
    expect(normalizeUrl("http://x.com")).toBe("http://x.com")
    expect(normalizeUrl("mailto:a@b.com")).toBe("mailto:a@b.com")
    expect(normalizeUrl("tel:+33600000000")).toBe("tel:+33600000000")
  })
  it("gere le vide et les espaces", () => {
    expect(normalizeUrl("")).toBe("")
    expect(normalizeUrl("   ")).toBe("")
    expect(normalizeUrl("  x.com  ")).toBe("https://x.com")
  })
})

describe("lum + contrast", () => {
  it("luminance : blanc ~1, noir ~0", () => {
    expect(lum("#FFFFFF")).toBeCloseTo(1, 4)
    expect(lum("#000000")).toBeCloseTo(0, 4)
  })
  it("contraste noir vs blanc = 21", () => {
    expect(contrast("#000000", "#FFFFFF")).toBeCloseTo(21, 5)
  })
  it("contraste couleurs identiques = 1", () => {
    expect(contrast("#C9A84C", "#C9A84C")).toBeCloseTo(1, 5)
  })
  it("contraste est symetrique", () => {
    expect(contrast("#080808", "#FEF3C7")).toBeCloseTo(contrast("#FEF3C7", "#080808"), 6)
  })
  it("gris clair sur blanc = faible contraste (<2.5, avertissement)", () => {
    expect(contrast("#CCCCCC", "#FFFFFF")).toBeLessThan(2.5)
  })
  it("noir sur blanc = bon contraste (>=2.5)", () => {
    expect(contrast("#080808", "#FFFFFF")).toBeGreaterThanOrEqual(2.5)
  })
})
