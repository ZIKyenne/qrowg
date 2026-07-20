import { describe, it, expect } from "vitest"
import { buildOptions, mapDotType, mapCornerSquareType, mapCornerDotType, type QROptions, type QRStyleConfig } from "./qrRender"

const base = (style: QRStyleConfig = {}, over: Partial<QROptions> = {}): QROptions => ({
  data: "https://exemple.fr", fg: "#080808", bg: "#FFFFFF", ecc: "M", style, ...over,
})

describe("mapDotType", () => {
  it("mappe chaque style vers le type qr-code-styling", () => {
    expect(mapDotType("dot")).toBe("dots")
    expect(mapDotType("rounded")).toBe("rounded")
    expect(mapDotType("softSquare")).toBe("classy-rounded")
    expect(mapDotType("pixel")).toBe("square")
    expect(mapDotType("minimal")).toBe("dots")
    expect(mapDotType("neon")).toBe("extra-rounded")
    expect(mapDotType("luxury")).toBe("classy")
  })
  it("defaut = square (inconnu / undefined)", () => {
    expect(mapDotType(undefined)).toBe("square")
    expect(mapDotType("xxx")).toBe("square")
  })
})

describe("mapCornerSquareType", () => {
  it("mappe les coins", () => {
    expect(mapCornerSquareType("rounded")).toBe("extra-rounded")
    expect(mapCornerSquareType("circle")).toBe("dot")
    expect(mapCornerSquareType("luxury")).toBe("extra-rounded")
    expect(mapCornerSquareType("diamond")).toBe("square")
    expect(mapCornerSquareType("minimal")).toBe("dot")
    expect(mapCornerSquareType(undefined)).toBe("square")
  })
})

describe("mapCornerDotType", () => {
  it("circle/luxury/minimal -> dot, sinon square", () => {
    expect(mapCornerDotType("circle")).toBe("dot")
    expect(mapCornerDotType("luxury")).toBe("dot")
    expect(mapCornerDotType("minimal")).toBe("dot")
    expect(mapCornerDotType("rounded")).toBe("square")
    expect(mapCornerDotType(undefined)).toBe("square")
  })
})

describe("buildOptions — base", () => {
  it("taille et marge par defaut", () => {
    const o = buildOptions(base())
    expect(o.width).toBe(400)
    expect(o.height).toBe(400)
    expect(o.margin).toBe(10)
  })
  it("taille et marge personnalisees", () => {
    const o = buildOptions(base({ margin: 2 }, { size: 1024 }))
    expect(o.width).toBe(1024)
    expect(o.margin).toBe(2)
  })
  it("repli sur l'URL de marque si data vide", () => {
    expect(buildOptions(base({}, { data: "" })).data).toBe("https://qrowg.com")
    expect(buildOptions(base({}, { data: "abc" })).data).toBe("abc")
  })
  it("passe le niveau de correction d'erreur", () => {
    expect(buildOptions(base({}, { ecc: "H" })).qrOptions.errorCorrectionLevel).toBe("H")
  })
  it("couleur des points = fg quand pas de gradient", () => {
    const o = buildOptions(base())
    expect(o.dotsOptions.color).toBe("#080808")
    expect(o.dotsOptions.gradient).toBeUndefined()
  })
})

describe("buildOptions — fond", () => {
  it("fond transparent -> rgba(0,0,0,0)", () => {
    const o = buildOptions(base({ transparent: true }))
    expect(o.backgroundOptions.color).toBe("rgba(0,0,0,0)")
  })
  it("fond plein -> couleur bg", () => {
    expect(buildOptions(base()).backgroundOptions.color).toBe("#FFFFFF")
  })
})

describe("buildOptions — gradients", () => {
  it("gradient lineaire applique une rotation PI/2 avec fg2", () => {
    const o = buildOptions(base({ gradient: "linear", fg2: "#C9A84C" }))
    expect(o.dotsOptions.color).toBeUndefined()
    expect(o.dotsOptions.gradient.type).toBe("linear")
    expect(o.dotsOptions.gradient.rotation).toBeCloseTo(Math.PI / 2, 5)
    expect(o.dotsOptions.gradient.colorStops[0].color).toBe("#080808")
    expect(o.dotsOptions.gradient.colorStops[1].color).toBe("#C9A84C")
  })
  it("gradient diagonal -> rotation PI/4", () => {
    const o = buildOptions(base({ gradient: "diagonal", fg2: "#fff" }))
    expect(o.dotsOptions.gradient.rotation).toBeCloseTo(Math.PI / 4, 5)
  })
  it("gradient radial -> type radial", () => {
    const o = buildOptions(base({ gradient: "radial", fg2: "#fff" }))
    expect(o.dotsOptions.gradient.type).toBe("radial")
  })
  it("gradient sans fg2 est ignore (repli couleur unie)", () => {
    const o = buildOptions(base({ gradient: "linear" }))
    expect(o.dotsOptions.gradient).toBeUndefined()
    expect(o.dotsOptions.color).toBe("#080808")
  })
  it("gradient de fond seulement si non transparent et gradientBg defini", () => {
    const withBg = buildOptions(base({ gradient: "linear", gradientBg: "#eee" }))
    expect(withBg.backgroundOptions.gradient.type).toBe("linear")
    const transp = buildOptions(base({ gradient: "linear", gradientBg: "#eee", transparent: true }))
    expect(transp.backgroundOptions.gradient).toBeUndefined()
    expect(transp.backgroundOptions.color).toBe("rgba(0,0,0,0)")
  })
})

describe("buildOptions — coins et yeux", () => {
  it("couleur des coins = cornerColor sinon fg", () => {
    expect(buildOptions(base()).cornersSquareOptions.color).toBe("#080808")
    expect(buildOptions(base({ cornerColor: "#ff0000" })).cornersSquareOptions.color).toBe("#ff0000")
  })
  it("couleur des yeux = eyeColor > cornerColor > fg", () => {
    expect(buildOptions(base()).cornersDotOptions.color).toBe("#080808")
    expect(buildOptions(base({ cornerColor: "#111111" })).cornersDotOptions.color).toBe("#111111")
    expect(buildOptions(base({ cornerColor: "#111111", eyeColor: "#222222" })).cornersDotOptions.color).toBe("#222222")
  })
})

describe("buildOptions — logo", () => {
  it("sans logo : aucune image", () => {
    const o = buildOptions(base())
    expect(o.image).toBeUndefined()
    expect(o.imageOptions).toBeUndefined()
  })
  it("avec logo : image + options, taille bornee a 30%", () => {
    const o = buildOptions(base({ logoUrl: "data:x", logoSize: 50, logoPadding: 6 }))
    expect(o.image).toBe("data:x")
    expect(o.imageOptions.imageSize).toBe(0.30) // 50% clampe a 30%
    expect(o.imageOptions.margin).toBe(6)
    expect(o.imageOptions.hideBackgroundDots).toBe(true)
  })
  it("taille de logo par defaut = 18% et marge par defaut = 4", () => {
    const o = buildOptions(base({ logoUrl: "data:x" }))
    expect(o.imageOptions.imageSize).toBeCloseTo(0.18, 5)
    expect(o.imageOptions.margin).toBe(4)
  })
})
