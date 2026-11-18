import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { cibleUnLienInterne } from "./MobileSheet"

// Lot 5 « appli » (18 nov.) : quel toucher dans une feuille est une navigation ?
const ICI = "https://qrowg.com/dashboard?onglet=1"

describe("un lien touché dans une feuille", () => {
  it("interne, ailleurs, même onglet : navigation", () => {
    expect(cibleUnLienInterne({ href: "/dashboard/leads" }, ICI, false)).toBe(true)
    expect(cibleUnLienInterne({ href: "/dashboard?onglet=2" }, ICI, false)).toBe(true)
  })
  it("pas un lien, ou le même écran : rien (la feuille reste, ou se ferme sur place)", () => {
    expect(cibleUnLienInterne(null, ICI, false)).toBe(false)
    expect(cibleUnLienInterne({ href: "/dashboard?onglet=1" }, ICI, false)).toBe(false)
    expect(cibleUnLienInterne({ href: "#section" }, ICI, false)).toBe(false)
  })
  it("autre onglet, autre site, téléchargement, touche modificatrice : rien", () => {
    expect(cibleUnLienInterne({ href: "/x", target: "_blank" }, ICI, false)).toBe(false)
    expect(cibleUnLienInterne({ href: "https://wa.me/33" }, ICI, false)).toBe(false)
    expect(cibleUnLienInterne({ href: "/x.png", download: true }, ICI, false)).toBe(false)
    expect(cibleUnLienInterne({ href: "/x" }, ICI, true)).toBe(false)
  })
  it("MobileSheet le branche sur TOUT clic de la feuille (aucun écran n'a rien à faire)", () => {
    const src = readFileSync(join(__dirname, "MobileSheet.tsx"), "utf8")
    expect(src).toContain("onClickCapture=")
    expect(src).toContain("historiqueDesFeuilles().lienSuivi()")
  })
})
