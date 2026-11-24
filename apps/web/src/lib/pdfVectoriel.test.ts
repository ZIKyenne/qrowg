import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { placeDuQr } from "./pdfVectoriel"

// Vague 3, point 4 (revue du 23 nov.) : le QR des PDF en tracés (svg2pdf.js).

describe("où se pose le QR", () => {
  it("« taille » : une page exactement de la taille du QR", () => {
    expect(placeDuQr({ format: "taille", mm: 32.5 })).toEqual({ page: [32.5, 32.5], x: 0, y: 0, cote: 32.5 })
    // Bornes : ni une page minuscule, ni une page de dix mètres.
    expect(placeDuQr({ format: "taille", mm: 2 }).cote).toBe(10)
    expect(placeDuQr({ format: "taille", mm: 5000 }).cote).toBe(1000)
  })
  it("« a4 » : le QR centré, 60 % de la largeur", () => {
    const p = placeDuQr({ format: "a4" })
    expect(p.page).toEqual([210, 297])
    expect(p.cote).toBe(126)
    expect(p.x).toBe(42)
    expect(p.y).toBeCloseTo(85.5)
  })
})

describe("la dépendance est épinglée, et chargée à la demande", () => {
  it("svg2pdf.js à une version exacte ; importé seulement au moment du PDF", () => {
    const pkg = JSON.parse(readFileSync(join(__dirname, "../../../../package.json"), "utf8"))
    expect(pkg.dependencies["svg2pdf.js"]).toBe("2.9.0")
    const src = readFileSync(join(__dirname, "pdfVectoriel.ts"), "utf8")
    expect(src).toContain('import("svg2pdf.js")')
    expect(src).not.toMatch(/^import .*svg2pdf/m)
  })
})
