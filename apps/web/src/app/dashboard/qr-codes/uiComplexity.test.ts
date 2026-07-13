import { describe, it, expect } from "vitest"
import { isAdvancedSection, showSection, nextMode, coerceMode } from "./uiComplexity"

describe("isAdvancedSection", () => {
  it("coins/ECC QR = avances", () => {
    expect(isAdvancedSection("qr-corners")).toBe(true)
    expect(isAdvancedSection("qr-ecc")).toBe(true)
  })
  it("effets/espacement texte = avances", () => {
    expect(isAdvancedSection("text-effects")).toBe(true)
    expect(isAdvancedSection("text-spacing")).toBe(true)
  })
  it("section inconnue = non avancee (essentielle par defaut)", () => {
    expect(isAdvancedSection("qr-colors")).toBe(false)
    expect(isAdvancedSection("nimporte")).toBe(false)
  })
})

describe("showSection", () => {
  it("Simple masque les avancees", () => {
    expect(showSection("qr-corners", "simple")).toBe(false)
    expect(showSection("qr-ecc", "simple")).toBe(false)
  })
  it("Simple garde l'essentiel", () => {
    expect(showSection("qr-colors", "simple")).toBe(true)
    expect(showSection("qr-modules", "simple")).toBe(true)
  })
  it("Expert montre tout", () => {
    expect(showSection("qr-corners", "expert")).toBe(true)
    expect(showSection("qr-ecc", "expert")).toBe(true)
    expect(showSection("qr-colors", "expert")).toBe(true)
  })
})

describe("nextMode", () => {
  it("bascule", () => {
    expect(nextMode("simple")).toBe("expert")
    expect(nextMode("expert")).toBe("simple")
  })
})

describe("coerceMode", () => {
  it("expert reconnu", () => expect(coerceMode("expert")).toBe("expert"))
  it("tout le reste -> simple", () => {
    expect(coerceMode("simple")).toBe("simple")
    expect(coerceMode(null)).toBe("simple")
    expect(coerceMode("xyz")).toBe("simple")
    expect(coerceMode(undefined)).toBe("simple")
  })
})
