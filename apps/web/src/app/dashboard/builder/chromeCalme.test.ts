import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

// 9 septembre — la chrome de l'éditeur suit la coquille (maquette « nouvelle
// direction ») : barre du haut sur --bg avec le lockup QROWG, bibliothèque et
// inspecteur sur --bg séparés par un filet, scène quadrillée, une seule couleur
// d'accent (plus de tuiles arc-en-ciel par catégorie), segmenteurs sans or plein.
// Le contenu de la page (bgStyle, thème, blocs) n'est pas concerné.

const lire = (p: string) => readFileSync(join(__dirname, p), "utf8")
const v4 = lire("BuilderV4.tsx")
const panels = lire("builderPanels.tsx")

const entre = (src: string, debut: string, fin: string) => {
  const a = src.indexOf(debut); const b = src.indexOf(fin, a)
  expect(a, debut).toBeGreaterThan(-1); expect(b, fin).toBeGreaterThan(a)
  return src.slice(a, b)
}

describe("chrome de l'éditeur — barre du haut", () => {
  const barre = entre(v4, "{/* TOPBAR", "{/* Boutons Undo / Redo */}")
  it("est sur --bg avec un filet --line, à la hauteur de la coquille (56 px)", () => {
    expect(barre).toContain('background: "var(--bg)", borderBottom: "1px solid var(--line)"')
    expect(barre).toContain("height: isMobile ? 50 : 56")
    expect(barre).not.toContain("#0D0D0D")
  })
  it("porte le même lockup QROWG que la coquille, précédé d'une flèche de retour", () => {
    expect(barre).toContain("<ArrowLeft size={16}")
    expect(barre).toContain(">QROWG</span>")
    expect(barre).not.toContain("← QRowg")
  })
  it("ses boutons sont plats : surface-2 + contour, l'or reste à Publier", () => {
    const boutons = entre(v4, "{/* Boutons Undo / Redo */}", "{/* Raccourcis clavier")
    expect(boutons).not.toMatch(/rgba\(201,168,76/)
    expect(boutons).toContain('background: "var(--surface-2)", border: "1px solid var(--line-strong)"')
  })
})

describe("chrome de l'éditeur — bibliothèque", () => {
  const biblio = entre(v4, "{/* SIDEBAR BLOCS", "{/* CANVAS */}")
  it("est sur --bg, séparée par un filet", () => {
    expect(biblio).toContain('background: "var(--bg)", borderRight: "1px solid var(--line)"')
  })
  it("les catégories ne colorent plus chacune leur tuile : une seule couleur d'accent", () => {
    const tuiles = entre(biblio, "{BLOCK_CATEGORIES.map(cat => (", "</button>\n                  ))}")
    expect(tuiles).not.toMatch(/background: activeCategory===cat\.id \? `color-mix\(in srgb, \$\{cat\.color\}/)
    expect(tuiles).toContain('color: activeCategory===cat.id ? "var(--accent)" : MUTED')
  })
  it("les vignettes des blocs sont neutres (plus de teinte par bloc)", () => {
    expect(biblio).not.toContain('background: def.color+"12"')
    expect(biblio).not.toContain('el.style.background = def.color+"10"')
  })
  it("la recherche est un champ standard", () => {
    expect(biblio).toContain('background: "var(--field)", border: "1px solid var(--line)"')
    expect(biblio).not.toContain('background: "#111"')
  })
})

describe("chrome de l'éditeur — scène et inspecteur", () => {
  it("la scène est quadrillée (stage-grid) sur --bg", () => {
    const scene = entre(v4, "{/* CANVAS */}", "{/* C04 — Toolbar canvas")
    expect(scene).toContain('className={isMobile ? undefined : "stage-grid"}')
    expect(scene).toContain('background: "var(--bg)"')
    expect(scene).not.toContain("#0A0A0A")
  })
  it("le bandeau au-dessus de la page ne crie plus CANVAS", () => {
    expect(v4).not.toContain(">CANVAS</span>")
    expect(v4).toContain(">Votre page</span>")
  })
  it("l'inspecteur est sur --bg avec un filet, ses onglets soulignés et non des boutons or", () => {
    expect(v4).toContain('background: "var(--bg)", borderLeft: "1px solid var(--line)"')
    expect(v4).not.toContain('background: "#161616"')
    const onglets = entre(v4, "{/* Onglets d'édition du bloc", "{/* CONTENU —")
    expect(onglets).toContain('role="tablist"')
    expect(onglets).not.toContain("linear-gradient")
  })
  it("l'en-tête du bloc sélectionné annonce « Propriétés » et le nom du bloc", () => {
    expect(v4).toContain(">Propriétés</p>")
  })
})

describe("segmenteurs de l'inspecteur", () => {
  it("segment actif = surface + encre + filet d'accent, jamais d'or plein", () => {
    const seg = entre(panels, "export function Segmented(", "// Repeteur generique")
    expect(seg).not.toContain("linear-gradient")
    expect(seg).not.toContain("#1a1408")
    expect(seg).toContain('aria-pressed={on}')
    expect(seg).toContain("inset 0 -2px 0 var(--accent)")
  })
})
