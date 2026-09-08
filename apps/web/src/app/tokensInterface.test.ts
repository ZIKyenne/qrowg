/**
 * Palette « Calme » (8 septembre) — garde-fou de contraste.
 *
 * Le dashboard écrit son texte avec --ink / --muted / --faint sur --bg,
 * --surface et --surface-2 ; les boutons primaires écrivent #15150F sur
 * --accent (= --gold par défaut). Ces couples doivent rester lisibles
 * (WCAG AA : 4,5:1 pour le texte, 3:1 pour les contours et les grands
 * éléments). Le test lit globals.css, le seul fichier CSS importé.
 */
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

const CSS = readFileSync(join(__dirname, "globals.css"), "utf8")
const ROOT = CSS.slice(CSS.indexOf(":root {"), CSS.indexOf("\n}\n", CSS.indexOf(":root {")))

function token(name: string): string {
  const m = ROOT.match(new RegExp(`--${name}\\s*:\\s*([^;]+);`))
  if (!m) throw new Error(`token --${name} absent de :root`)
  return m[1].trim()
}

type Rgb = [number, number, number]

function hex(h: string): Rgb {
  const s = h.replace("#", "")
  const f = s.length === 3 ? s.split("").map((c) => c + c).join("") : s
  return [0, 2, 4].map((i) => parseInt(f.slice(i, i + 2), 16)) as Rgb
}

/** rgba(r,g,b,a) posé sur un fond → couleur résultante. */
function over(fg: string, bg: Rgb): Rgb {
  const m = fg.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/)
  if (!m) return hex(fg)
  const a = m[4] === undefined ? 1 : Number(m[4])
  return [1, 2, 3].map((i) => Math.round(Number(m[i]) * a + bg[i - 1] * (1 - a))) as Rgb
}

function lum([r, g, b]: Rgb): number {
  const c = [r, g, b].map((v) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
}

export function ratio(a: Rgb, b: Rgb): number {
  const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x)
  return (l1 + 0.05) / (l2 + 0.05)
}

const bg = hex(token("bg"))
const surface = hex(token("surface"))
const surface2 = hex(token("surface-2"))
const field = hex(token("field"))
const ink = hex(token("ink"))
const muted = hex(token("muted"))
const faint = hex(token("faint"))
const gold = hex(token("gold"))
const accent = hex(token("accent"))

describe("palette « Calme » — contraste", () => {
  it("le texte courant (--ink) et secondaire (--muted) lisent AA sur tous les fonds", () => {
    for (const fond of [bg, surface, surface2, field]) {
      expect(ratio(ink, fond)).toBeGreaterThanOrEqual(4.5)
      expect(ratio(muted, fond)).toBeGreaterThanOrEqual(4.5)
    }
  })

  it("les libellés discrets (--faint) restent AA sur --bg, --surface et --surface-2", () => {
    for (const fond of [bg, surface, surface2]) expect(ratio(faint, fond)).toBeGreaterThanOrEqual(4.5)
  })

  it("l'or lit ≥ 3:1 sur les fonds (contours, icônes, texte ≥ 18 px)", () => {
    for (const fond of [bg, surface, surface2]) expect(ratio(gold, fond)).toBeGreaterThanOrEqual(3)
  })

  it("l'encre des boutons primaires (#15150F) lit AA sur l'or et sur l'accent par défaut", () => {
    const encre = hex("#15150F")
    expect(ratio(encre, gold)).toBeGreaterThanOrEqual(4.5)
    expect(ratio(encre, accent)).toBeGreaterThanOrEqual(4.5)
    expect(CSS).toContain("#15150F")
  })

  it("les contours restent perceptibles : --line-strong ≥ 1,3:1 sur --surface, --line en dessous", () => {
    const strong = over(token("line-strong"), surface)
    const fin = over(token("line"), surface)
    expect(ratio(strong, surface)).toBeGreaterThanOrEqual(1.3)
    expect(ratio(fin, surface)).toBeLessThan(ratio(strong, surface))
  })

  it("--accent vaut --gold par défaut (le profil peut le remplacer)", () => {
    expect(token("accent")).toBe(token("gold"))
  })
})

describe("couche « Calme » — plus d'effets perpétuels", () => {
  const calme = CSS.slice(CSS.indexOf("COUCHE « CALME »"))

  it("existe et neutralise halos, gloss, sheen et particules décoratives", () => {
    expect(calme.length).toBeGreaterThan(100)
    for (const sel of [".qb-halo", ".dam-gloss", ".qb-sheen", ".da-btn-primary::after"]) {
      expect(calme).toContain(sel)
    }
    expect(calme).toMatch(/display:\s*none\s*!important/)
  })

  it("les boutons primaires sont plats : fond accent, encre sombre, sans ombre ni translation", () => {
    const bloc = calme.match(/\n\.da-btn-primary,[^{]*\{[^}]*\}/)?.[0] ?? ""
    expect(bloc).toContain("background: var(--accent)")
    expect(bloc).toContain("#15150F")
    expect(bloc).toMatch(/box-shadow:\s*none/)
  })

  it("le fond global n'a plus de halo ni de grille : le corps est un aplat --bg", () => {
    const body = CSS.match(/\nbody::before\s*\{[^}]*\}/)?.[0] ?? ""
    expect(body).not.toMatch(/radial-gradient|linear-gradient/)
    expect(CSS).not.toMatch(/\nbody::after\s*\{/)
  })
})
