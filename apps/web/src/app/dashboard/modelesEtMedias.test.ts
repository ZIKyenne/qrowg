import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

// 9 septembre — Modèles et Médias : cartes plates sur --surface + filet, vignette
// à plat aux couleurs du modèle (sans halo ni zoom), badges neutres, un seul
// bouton or par carte (Utiliser), filtres actifs sur surface-2 + filet d'accent.

const lire = (p: string) => readFileSync(join(__dirname, p), "utf8")
const css = readFileSync(join(__dirname, "../globals.css"), "utf8")

describe("cartes de modèles", () => {
  const src = lire("templates/page.tsx")
  it("sont plates : --surface, filet, sans levée ni grande ombre", () => {
    expect(src).toContain('background: "var(--surface)",\n                    border: "1px solid " + (isHovered ? "var(--line-strong)" : "var(--line)")')
    expect(src).not.toContain('transform: isSelected ? "translateY(-4px)"')
    expect(src).not.toContain("0 16px 40px rgba(0,0,0,0.5)")
  })
  it("la vignette garde les couleurs du modèle, à plat, sans halo ni zoom au survol", () => {
    expect(src).toContain('background: template.surface, border: 0, borderBottom: "1px solid var(--line)"')
    expect(src).not.toContain("radial-gradient(ellipse at 50% 0%")
    expect(src).not.toContain("scale(\" + (isHovered ? 1.06 : 1)")
    expect(src).not.toContain("{/* Barre de couleur bas */}")
  })
  it("badges neutres : plan, catégorie, populaire, tags", () => {
    expect(src).not.toContain("background: planCfg.color + \"18\"")
    expect(src).not.toContain('background: template.color + "12"')
    expect(src).not.toContain("background: tier.color + \"16\"")
    expect(src).toContain('background: "var(--surface-2)", border: "1px solid var(--line)", borderRadius: 4')
  })
  it("un seul bouton or par carte : Utiliser ; Aperçu est neutre", () => {
    expect(src).toContain('className="da-btn-neutral da-btn-neutral--sm" aria-label={`Aperçu de ${template.name}`}')
    expect(src).toContain('className={locked ? undefined : "da-btn-primary da-btn-primary--sm"}')
    expect(src).not.toContain('className="dam-selbar-sec"')
    expect(src).not.toContain('className="dam-gloss"')
  })
  it("les filtres actifs sont sur surface-2 avec un filet d'accent, pas en or plein", () => {
    expect(css).toContain(".dat-chip.on { background:var(--surface-2); border-color:color-mix(in srgb, var(--accent) 50%, transparent); color:var(--accent)")
    expect(css).toContain(".dat-planpill.on { background:var(--surface-2); color:var(--ink); font-weight:600; box-shadow:inset 0 -2px 0 var(--accent); }")
    expect(css).toContain(".dat-chip.on .dat-chippill { background:var(--surface); color:var(--accent); }")
  })
})

describe("Médias", () => {
  const src = lire("assets/page.tsx")
  it("Importer est le bouton primaire plat, sans halo ni reflet", () => {
    expect(src).toContain('<label className="da-btn-primary da-btn-primary--sm"')
    expect(src).not.toContain('className="dam-halo"')
    expect(src).not.toContain('className="dam-sheen"')
  })
  it("cartes et lignes sur jetons ; onglets actifs sur surface-2", () => {
    expect(src).not.toMatch(/rgba\(201,168,76/)
    expect(css).toContain(".dam-card { border:1px solid var(--line); transition:border-color .15s ease; }")
    expect(css).toContain(".dam-tab.on { background:var(--surface-2); color:var(--ink); font-weight:600; box-shadow:inset 0 -2px 0 var(--accent); }")
  })
})
