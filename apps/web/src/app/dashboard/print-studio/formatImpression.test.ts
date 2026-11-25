import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { ITEM_BY_ID } from "./catalog"
import { trimWidthMm, pageDims, mediaDims, phraseFormatPdf, CROP_MARGIN_MM, cssDImpression } from "./formatImpression"

// Audit du 14 novembre 2026 (C6) : la sortie Chevalet, vérifiée au millimètre.
const chevalet = ITEM_BY_ID["i2"]

describe("le chevalet de table", () => {
  it("100 × 70 fini, 106 × 76 avec fond perdu, page PDF 114 × 84 avec les traits de coupe", () => {
    expect(chevalet.name).toBe("Chevalet de table")
    expect([trimWidthMm(chevalet), chevalet.hMm]).toEqual([100, 70])
    expect(pageDims(chevalet)).toEqual({ pageWmm: 106, pageHmm: 76 })
    expect(mediaDims(chevalet)).toEqual({ mediaWmm: 114, mediaHmm: 84 })
  })
  it("l'écran annonce les trois formats, celui du PDF en premier", () => {
    expect(phraseFormatPdf(chevalet)).toBe("PDF de 114 × 84 mm : support fini 100 × 70 mm, fond perdu de 3 mm (106 × 76 mm) et traits de coupe dans la marge blanche")
  })
})

describe("tout le catalogue", () => {
  const items = Object.values(ITEM_BY_ID)
  it("planche = fini + 2 fonds perdus ; page = planche + 2 marges (sauf découpe à la forme)", () => {
    for (const it of items) {
      const { pageWmm, pageHmm } = pageDims(it), { mediaWmm, mediaHmm } = mediaDims(it)
      expect(pageHmm, it.name).toBeCloseTo(it.hMm + 2 * it.bleed, 1)
      expect(pageWmm, it.name).toBeCloseTo(trimWidthMm(it) + 2 * it.bleed, 1)
      const m = it.shape === "round" ? 0 : CROP_MARGIN_MM
      expect(mediaWmm, it.name).toBeCloseTo(pageWmm + 2 * m, 1)
      expect(mediaHmm, it.name).toBeCloseTo(pageHmm + 2 * m, 1)
      expect(phraseFormatPdf(it), it.name).toMatch(new RegExp(`^PDF de ${String(it.shape === "round" ? pageWmm : mediaWmm).replace(".", ",")} ×`))
    }
  })
})

describe("le PDF produit est bien celui annoncé", () => {
  it("@page reprend mediaDims, et l'écran dit phraseFormatPdf", () => {
    // L'atelier et le rendu du support (les planches y sont depuis v383).
    const src = readFileSync(join(__dirname, "PrintStudioClient.tsx"), "utf8") + readFileSync(join(__dirname, "renduDuSupport.tsx"), "utf8")
    expect(src).toContain("cssDImpression(mediaDims(item).mediaWmm, mediaDims(item).mediaHmm)")
    // Les deux planches passent par la même feuille, rendues sous <body>.
    expect(src).toContain("const css = cssDImpression(pageW, pageH)")
    expect(src.match(/createPortal\(/g)?.length).toBe(2)
    expect(src).not.toContain("body *{visibility:hidden!important}")
    expect(src).toContain("{phraseFormatPdf(item)}")
    expect(src).not.toContain("À la taille réelle ({pageDims(item).pageWmm}")
  })
})

describe("la feuille d'impression (une page, pas sept)", () => {
  const css = cssDImpression(114, 84)
  it("retire le reste de l'écran de la mise en page, au lieu de le cacher", () => {
    expect(css).toContain("body>*:not(.ps-print-root){display:none!important}")
    expect(css).not.toContain("visibility:hidden")
    expect(css).not.toContain("position:fixed")
  })
  it("fixe la page au format de la planche, sans marge", () => {
    expect(css).toContain("@page{size:114mm 84mm;margin:0}")
    expect(css).toContain("height:84mm!important")
  })
})
