import { describe, it, expect } from "vitest"
import {
  normalizeHex, isValidHex, hexToRgb, rgbToHex, rgbToHsl, hslToRgb,
  hexToHsl, hslToHex, rotateHue, harmonies, pushRecent,
} from "./colorTools"

describe("normalizeHex", () => {
  it("#abc -> #AABBCC", () => expect(normalizeHex("#abc")).toBe("#AABBCC"))
  it("sans # et casse libre", () => expect(normalizeHex("Aabbcc")).toBe("#AABBCC"))
  it("espaces", () => expect(normalizeHex("  #C9A84C ")).toBe("#C9A84C"))
  it("invalide -> null", () => {
    expect(normalizeHex("xyz")).toBeNull()
    expect(normalizeHex("#12")).toBeNull()
    expect(normalizeHex("")).toBeNull()
  })
  it("isValidHex", () => {
    expect(isValidHex("#fff")).toBe(true)
    expect(isValidHex("nope")).toBe(false)
  })
})

describe("hex <-> rgb", () => {
  it("hexToRgb", () => expect(hexToRgb("#FF8000")).toEqual({ r: 255, g: 128, b: 0 }))
  it("rgbToHex", () => expect(rgbToHex({ r: 255, g: 128, b: 0 })).toBe("#FF8000"))
  it("rgbToHex borne et arrondit", () => expect(rgbToHex({ r: 300, g: -5, b: 127.6 })).toBe("#FF0080"))
  it("aller-retour", () => expect(rgbToHex(hexToRgb("#C9A84C")!)).toBe("#C9A84C"))
})

describe("rgb <-> hsl", () => {
  it("rouge pur", () => expect(rgbToHsl({ r: 255, g: 0, b: 0 })).toEqual({ h: 0, s: 100, l: 50 }))
  it("blanc", () => expect(rgbToHsl({ r: 255, g: 255, b: 255 })).toEqual({ h: 0, s: 0, l: 100 }))
  it("noir", () => expect(rgbToHsl({ r: 0, g: 0, b: 0 })).toEqual({ h: 0, s: 0, l: 0 }))
  it("hslToRgb rouge", () => expect(hslToRgb({ h: 0, s: 100, l: 50 })).toEqual({ r: 255, g: 0, b: 0 })),
  it("aller-retour hex approximatif", () => {
    const hex = "#3A7BD5"
    const back = hslToHex(hexToHsl(hex)!)
    // tolerance d'arrondi de +/- 2 par canal
    const a = hexToRgb(hex)!, b = hexToRgb(back)!
    expect(Math.abs(a.r - b.r)).toBeLessThanOrEqual(2)
    expect(Math.abs(a.g - b.g)).toBeLessThanOrEqual(2)
    expect(Math.abs(a.b - b.b)).toBeLessThanOrEqual(2)
  })
})

describe("rotateHue & harmonies", () => {
  it("rotation 360 = identite", () => expect(rotateHue("#C9A84C", 360)).toBe("#C9A84C"))
  it("complementaire = +180", () => {
    const h = harmonies("#FF0000")
    expect(h.complementary).toBe(rotateHue("#FF0000", 180))
  })
  it("analogues et triade : bon nombre + valides", () => {
    const h = harmonies("#2ECC71")
    expect(h.analogous).toHaveLength(2)
    expect(h.triadic).toHaveLength(2)
    for (const c of [h.complementary, ...h.analogous, ...h.triadic]) expect(isValidHex(c)).toBe(true)
  })
  it("teinte du complementaire ~ +180", () => {
    const base = hexToHsl("#FF0000")!.h
    const comp = hexToHsl(harmonies("#FF0000").complementary)!.h
    expect(comp).toBe((base + 180) % 360)
  })
})

describe("pushRecent", () => {
  it("ajoute en tete, normalise", () => {
    expect(pushRecent([], "#abc")).toEqual(["#AABBCC"])
  })
  it("dedupe (casse ignoree), remonte en tete", () => {
    expect(pushRecent(["#111111", "#AABBCC"], "#aabbcc")).toEqual(["#AABBCC", "#111111"])
  })
  it("plafonne", () => {
    const many = Array.from({ length: 12 }, (_, i) => "#0000" + i.toString(16).padStart(2, "0"))
    const out = pushRecent(many, "#FFFFFF", 12)
    expect(out).toHaveLength(12)
    expect(out[0]).toBe("#FFFFFF")
  })
  it("ignore une saisie invalide", () => {
    expect(pushRecent(["#111111"], "nope")).toEqual(["#111111"])
  })
})
