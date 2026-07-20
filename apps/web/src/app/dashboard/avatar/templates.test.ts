import { describe, it, expect } from "vitest"
import {
  currentGrid, buildExportSvg, FAMILIES, DEFAULT_CONFIG, PRESETS,
  type AvatarConfig,
} from "./templates"

const ones = (g: number[][]) => g.flat().filter(v => v === 1).length

describe("currentGrid", () => {
  it("figures / abstrait -> grille 15x15", () => {
    for (const fam of ["figures", "wild"] as const) {
      const g = currentGrid(fam, 0, false)
      expect(g.length).toBe(15)
      expect(g.every(r => r.length === 15)).toBe(true)
    }
  })
  it("motifs -> grille 11x11", () => {
    const g = currentGrid("patterns", 0, false)
    expect(g.length).toBe(11)
    expect(g.every(r => r.length === 11)).toBe(true)
  })
  it("ne contient que des 0 et des 1", () => {
    const g = currentGrid("figures", 3, true)
    expect(g.flat().every(v => v === 0 || v === 1)).toBe(true)
    expect(ones(g)).toBeGreaterThan(0)
  })
  it("les motifs sont deterministes (RNG a graine, pas Math.random)", () => {
    expect(currentGrid("patterns", 5, false)).toEqual(currentGrid("patterns", 5, false))
    // graines differentes -> motifs differents
    expect(currentGrid("patterns", 5, false)).not.toEqual(currentGrid("patterns", 6, false))
  })
  it("le cadre QR ajoute des modules en bordure (figures)", () => {
    const withFrame = ones(currentGrid("figures", 2, true))
    const without = ones(currentGrid("figures", 2, false))
    expect(withFrame).toBeGreaterThan(without)
  })
  it("l'index boucle modulo le nombre de modeles", () => {
    const n = FAMILIES.figures.count
    expect(currentGrid("figures", 0, false)).toEqual(currentGrid("figures", n, false))
  })
})

describe("buildExportSvg", () => {
  const cfg: AvatarConfig = { ...DEFAULT_CONFIG, fg: "#C9A84C", bg: "#080808" }

  it("produit un SVG 1024 valide avec fond et couleur", () => {
    const svg = buildExportSvg(cfg)
    expect(svg.startsWith("<svg")).toBe(true)
    expect(svg).toContain('width="1024"')
    expect(svg).toContain('viewBox="0 0 1024 1024"')
    expect(svg).toContain(`fill="${cfg.bg}"`) // fond
    expect(svg).toContain(`fill="${cfg.fg}"`) // modules
  })
  it("un rect module par cellule allumee (+ 1 pour le fond)", () => {
    const grid = currentGrid(cfg.family, cfg.index, cfg.showFrame)
    const svg = buildExportSvg(cfg)
    const fgRects = svg.split(`fill="${cfg.fg}"`).length - 1
    const bgRects = svg.split(`fill="${cfg.bg}"`).length - 1
    expect(fgRects).toBe(ones(grid))
    expect(bgRects).toBe(1)
  })
  it("avatar circulaire -> clipPath cercle", () => {
    expect(buildExportSvg({ ...cfg, avatarShape: "circle" })).toContain("clipPath")
    expect(buildExportSvg({ ...cfg, avatarShape: "rounded" })).not.toContain("clipPath")
  })
  it("est deterministe", () => {
    expect(buildExportSvg(cfg)).toBe(buildExportSvg(cfg))
  })
})

describe("FAMILIES / PRESETS", () => {
  it("3 familles avec un nombre de modeles positif", () => {
    expect(Object.keys(FAMILIES)).toEqual(["figures", "wild", "patterns"])
    for (const f of Object.values(FAMILIES)) {
      expect(f.count).toBeGreaterThan(0)
      expect(f.label).toBeTruthy()
    }
  })
  it("chaque index annonce est reellement rendu (pas de modele vide)", () => {
    for (const fam of ["figures", "wild"] as const) {
      for (let i = 0; i < FAMILIES[fam].count; i++) {
        expect(ones(currentGrid(fam, i, false)), `${fam} #${i} vide`).toBeGreaterThan(0)
      }
    }
  })
  it("les presets de couleur ont fg et bg", () => {
    expect(PRESETS.length).toBeGreaterThan(0)
    for (const p of PRESETS) {
      expect(p.fg).toMatch(/^#[0-9a-fA-F]{6}$/)
      expect(p.bg).toMatch(/^#[0-9a-fA-F]{6}$/)
    }
  })
})
