import { describe, it, expect } from "vitest"
import {
  resolveTheme, fontsUrl, readableText, patternCss, patternSize, backgroundStyle,
  PRESET_THEMES, DEFAULT_THEME_KEY, type PageTheme,
} from "./themes"

const BASE = PRESET_THEMES[DEFAULT_THEME_KEY]

describe("resolveTheme", () => {
  it("entree nulle / non-objet -> theme par defaut", () => {
    expect(resolveTheme(null)).toEqual(BASE)
    expect(resolveTheme(undefined)).toEqual(BASE)
    expect(resolveTheme("texte")).toEqual(BASE)
    expect(resolveTheme(42)).toEqual(BASE)
  })
  it("complete les champs manquants avec le defaut", () => {
    const t = resolveTheme({ background: "#123456", accent: "#abcdef" })
    expect(t.background).toBe("#123456")
    expect(t.accent).toBe("#abcdef")
    expect(t.surface).toBe(BASE.surface)   // herite
    expect(t.font_body).toBe(BASE.font_body)
  })
  it("bg_mode par defaut = solid", () => {
    expect(resolveTheme({}).bg_mode).toBe("solid")
    expect(resolveTheme({ bg_mode: "gradient" }).bg_mode).toBe("gradient")
  })
  it("conserve gradient et pattern quand fournis", () => {
    const t = resolveTheme({ bg_mode: "pattern", bg_pattern: "dots" })
    expect(t.bg_pattern).toBe("dots")
    expect(t.bg_gradient).toBeUndefined()
  })
})

describe("fontsUrl", () => {
  it("remplace les espaces des noms de police par +", () => {
    const url = fontsUrl({ ...BASE, font_display: "Playfair Display", font_body: "DM Sans" })
    expect(url).toContain("family=Playfair+Display:wght@400;600;700")
    expect(url).toContain("family=DM+Sans:wght@400;500;600")
    expect(url).toContain("display=swap")
  })
})

describe("readableText", () => {
  it("fond clair -> texte sombre, fond sombre -> texte blanc", () => {
    expect(readableText("#FFFFFF")).toBe("#0A0A0A")
    expect(readableText("#FFF9E0")).toBe("#0A0A0A")
    expect(readableText("#000000")).toBe("#FFFFFF")
    expect(readableText("#0A0A0A")).toBe("#FFFFFF")
  })
  it("couleur mediane cote sombre -> blanc", () => {
    expect(readableText("#808080")).toBe("#FFFFFF") // luminance ~0.216 < 0.5
  })
  it("robuste sur une valeur invalide -> blanc par defaut", () => {
    expect(readableText("#zzzzzz")).toBe("#FFFFFF")
  })
})

describe("patternCss / patternSize", () => {
  it("chaque motif produit un background-image, sinon undefined", () => {
    expect(patternCss("dots", "#C9A84C")).toContain("radial-gradient")
    expect(patternCss("grid", "#C9A84C")).toContain("linear-gradient")
    expect(patternCss("stars", "#C9A84C")).toContain("radial-gradient")
    expect(patternCss("waves", "#C9A84C")).toContain("repeating-linear-gradient")
    expect(patternCss(undefined, "#C9A84C")).toBeUndefined()
  })
  it("applique un alpha hex a la couleur du motif", () => {
    // dots -> alpha 0.18 => round(0.18*255)=46 => "2e"
    expect(patternCss("dots", "#C9A84C")).toContain("#C9A84C2e")
  })
  it("taille de tuile par motif (waves/inconnu -> auto)", () => {
    expect(patternSize("dots")).toBe("20px 20px")
    expect(patternSize("grid")).toBe("24px 24px")
    expect(patternSize("stars")).toBe("30px 30px")
    expect(patternSize("waves")).toBe("auto")
    expect(patternSize(undefined)).toBe("auto")
  })
})

describe("backgroundStyle", () => {
  const t = (over: Partial<PageTheme>): PageTheme => ({ ...BASE, ...over })

  it("mode gradient -> background = le gradient", () => {
    expect(backgroundStyle(t({ bg_mode: "gradient", bg_gradient: "linear-gradient(#000,#fff)" })))
      .toEqual({ background: "linear-gradient(#000,#fff)" })
  })
  it("mode gradient sans gradient defini -> repli solide", () => {
    expect(backgroundStyle(t({ bg_mode: "gradient", bg_gradient: undefined })))
      .toEqual({ background: BASE.background })
  })
  it("mode pattern -> couleur + image + taille", () => {
    const s = backgroundStyle(t({ bg_mode: "pattern", bg_pattern: "grid" }))
    expect(s.backgroundColor).toBe(BASE.background)
    expect(String(s.backgroundImage)).toContain("linear-gradient")
    expect(s.backgroundSize).toBe("24px 24px")
  })
  it("mode solide (defaut) -> background = couleur", () => {
    expect(backgroundStyle(t({ bg_mode: "solid" }))).toEqual({ background: BASE.background })
  })
})
