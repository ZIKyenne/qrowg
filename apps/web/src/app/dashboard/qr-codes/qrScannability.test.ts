import { describe, it, expect } from "vitest"
import { qrScannability, scanLevelColor, type QrScanInput } from "./qrScannability"

const base: QrScanInput = { fg: "#000000", bg: "#FFFFFF", ecc: "M" }

describe("qrScannability — contraste", () => {
  it("noir sur blanc = excellent, sans conseil bloquant", () => {
    const r = qrScannability(base)
    expect(r.level).toBe("excellent")
    expect(r.score).toBeGreaterThanOrEqual(85)
    expect(r.contrast).toBeGreaterThan(20)
    expect(r.inverted).toBe(false)
  })

  it("contraste insuffisant (gris clair sur blanc) => risque + conseil prioritaire", () => {
    const r = qrScannability({ fg: "#CCCCCC", bg: "#FFFFFF", ecc: "M" })
    expect(r.level).toBe("risque")
    expect(r.score).toBeLessThan(50)
    expect(r.advices[0]).toMatch(/[Cc]ontraste/)
  })

  it("contraste juste (gris moyen) => penalise mais pas catastrophique", () => {
    const r = qrScannability({ fg: "#767676", bg: "#FFFFFF", ecc: "M" })
    expect(r.contrast).not.toBeNull()
    expect(r.score).toBeLessThan(100)
    expect(r.score).toBeGreaterThan(50)
  })

  it("couleur invalide => contrast null + forte penalite", () => {
    const r = qrScannability({ fg: "pas-une-couleur", bg: "#FFFFFF", ecc: "M" })
    expect(r.contrast).toBeNull()
    expect(r.level).toBe("risque")
    expect(r.advices.some(a => /invalide/i.test(a))).toBe(true)
  })
})

describe("qrScannability — negatif / inversion", () => {
  it("blanc sur noir => inverted true + conseil negatif (mais reste lisible)", () => {
    const r = qrScannability({ fg: "#FFFFFF", bg: "#000000", ecc: "M" })
    expect(r.inverted).toBe(true)
    expect(r.advices.some(a => /négatif/i.test(a))).toBe(true)
    // contraste parfait -> pas 'risque' malgre l'inversion
    expect(r.score).toBeGreaterThan(70)
  })

  it("foncé sur clair => pas d'inversion", () => {
    expect(qrScannability({ fg: "#13243A", bg: "#F8F8F8", ecc: "M" }).inverted).toBe(false)
  })
})

describe("qrScannability — correction d'erreur & logo", () => {
  it("logo + ECC basse (M) => conseille de monter en Q/H", () => {
    const r = qrScannability({ ...base, hasLogo: true, ecc: "M" })
    expect(r.advices.some(a => /correction d'erreur/i.test(a))).toBe(true)
    expect(r.score).toBeLessThan(qrScannability({ ...base, hasLogo: true, ecc: "H" }).score)
  })

  it("logo + ECC H => aucune alerte de correction d'erreur", () => {
    const r = qrScannability({ ...base, hasLogo: true, ecc: "H" })
    expect(r.advices.some(a => /correction d'erreur/i.test(a))).toBe(false)
    expect(r.level).toBe("excellent")
  })

  it("sans logo, ECC L => conseil de monter a M (penalite legere)", () => {
    const r = qrScannability({ ...base, ecc: "L" })
    expect(r.advices.some(a => /\bL\b/.test(a) || /basse/i.test(a))).toBe(true)
    expect(r.score).toBeLessThan(100)
  })
})

describe("qrScannability — fond transparent & marge", () => {
  it("transparent => contrast null + conseil support clair", () => {
    const r = qrScannability({ fg: "#000000", bg: "#FFFFFF", transparent: true, ecc: "M" })
    expect(r.contrast).toBeNull()
    expect(r.advices.some(a => /transparent/i.test(a))).toBe(true)
  })

  it("marge nulle => conseil de marge tranquille", () => {
    const r = qrScannability({ ...base, margin: 0 })
    expect(r.advices.some(a => /marge tranquille/i.test(a))).toBe(true)
  })

  it("marge presente => pas d'alerte de marge", () => {
    const r = qrScannability({ ...base, margin: 10 })
    expect(r.advices.some(a => /marge tranquille/i.test(a))).toBe(false)
  })
})

describe("qrScannability — bornes & tri", () => {
  it("score borne entre 0 et 100", () => {
    const worst = qrScannability({ fg: "#FEFEFE", bg: "#FFFFFF", ecc: "L", hasLogo: true, dotStyle: "neon", margin: 0 })
    expect(worst.score).toBeGreaterThanOrEqual(0)
    expect(worst.score).toBeLessThanOrEqual(100)
  })

  it("conseils tries par priorite decroissante (contraste avant style)", () => {
    const r = qrScannability({ fg: "#BFBFBF", bg: "#FFFFFF", ecc: "M", dotStyle: "neon" })
    // le conseil contraste (penalite forte) doit preceder le conseil de style (penalite faible)
    const iContrast = r.advices.findIndex(a => /[Cc]ontraste/.test(a))
    const iStyle = r.advices.findIndex(a => /assez grand/.test(a))
    expect(iContrast).toBeGreaterThanOrEqual(0)
    if (iStyle >= 0) expect(iContrast).toBeLessThan(iStyle)
  })

  it("scanLevelColor renvoie une couleur par niveau", () => {
    expect(scanLevelColor("excellent")).toMatch(/^#/)
    expect(scanLevelColor("risque")).toMatch(/^#/)
  })
})
