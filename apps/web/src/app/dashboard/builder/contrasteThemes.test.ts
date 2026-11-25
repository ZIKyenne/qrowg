import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

// ─────────────────────────────────────────────────────────────────────────────
// LE TEXTE DOIT SE DÉTACHER DE SON FOND — DANS TOUS LES THÈMES
//
// Un texte de 13,5 px ne sert à rien s'il est gris clair sur fond clair. Le
// rapport de contraste se calcule exactement (WCAG 2.1) : 4,5:1 est le seuil AA
// pour du texte de taille normale, et c'est celui qui s'applique ici — les
// descriptions, les prix, les libellés de la page publiée sont tous du texte
// courant, pas des gros titres.
//
// Mesuré avant correction sur les 39 thèmes des trois registres : 15 paires
// sous le seuil, dont « Crème » à 3,40:1 et « Blush Atelier » à 3,43:1 pour la
// couleur principale — celle des PRIX sur une carte de restaurant.
//
// Les corrections ont gardé teinte et saturation, en ne bougeant que la clarté
// (de 1 à 9 points sur 100) : la couleur reste la même à l'œil, elle passe le
// seuil. Ce test empêche un nouveau thème de repasser en dessous.
// ─────────────────────────────────────────────────────────────────────────────

const ici = dirname(fileURLToPath(import.meta.url))

/** Luminance relative, formule WCAG 2.1. */
function luminance(hex: string): number {
  const s = hex.replace("#", "").slice(0, 6)
  const c = [0, 2, 4].map(i => {
    const v = parseInt(s.slice(i, i + 2), 16) / 255
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
}

export function contraste(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)]
  const [haut, bas] = x > y ? [x, y] : [y, x]
  return (haut + 0.05) / (bas + 0.05)
}

type Theme = { fichier: string; nom: string; bg: string; surface: string; text: string; muted: string; primary: string }

/** Lit les thèmes d'un registre. Les objets sont plats : une accolade = un thème. */
function themesDe(fichier: string, cleFond: string): Theme[] {
  const src = readFileSync(join(ici, fichier), "utf8")
  const out: Theme[] = []
  for (const m of src.matchAll(/\{[^{}]*?name:\s*['"]([^'"]+)['"][^{}]*?\}/g)) {
    const champ = (k: string) => {
      const x = m[0].match(new RegExp("\\b" + k + ":\\s*['\"](#[0-9a-fA-F]{3,8})['\"]"))
      return x ? x[1] : null
    }
    const t = { fichier, nom: m[1], bg: champ(cleFond), surface: champ("surface"), text: champ("text"), muted: champ("muted"), primary: champ("primary") }
    if (t.bg && t.surface && t.text && t.muted && t.primary) out.push(t as Theme)
  }
  return out
}

const REGISTRES: [string, string][] = [["page-templates.ts", "bg"], ["editorPresets.ts", "bg"], ["templatesStudio.ts", "bg"]]
const TOUS = REGISTRES.flatMap(([f, k]) => themesDe(f, k))

// ── Les thèmes de l'éditeur (point 6, lots 1 et 2 — 25 nov.) ──
//
// Jusqu'au 25 nov., cette garde lisait `themes.ts` — un fichier mort, que plus
// rien n'affichait — au lieu de `editorPresets.ts`, qui porte les 152 thèmes
// que l'éditeur propose VRAIMENT. Rebranchée, elle a trouvé 114 thèmes sous le
// seuil : le produit les proposait, puis son alerte d'avant publication
// (themeLisible.ts) les déclarait illisibles. Les 140 couleurs fautives ont été
// corrigées en ne bougeant que leur clarté HSL ; deux thèmes à fond vif ont été
// traités à la main (Summer Festival : encre brun foncé dans la teinte de
// l'orange ; Pop Art Music : arrêts du dégradé assombris sous l'encre blanche).
// Il n'y a plus de dette : la règle vaut pour tous, sans exception.
const ACTIFS = TOUS
const RE_THEME = /\{[^{}]*?name:\s*['"]([^'"]+)['"][^{}]*?\}/g
const RE_DEGRADE = /(?:bgGradient|bg_gradient):\s*['"]([^'"]+)['"]/
const couleurDe = (bloc: string, champ: string) => bloc.match(new RegExp("\\b" + champ + ":\\s*['\"](#[0-9a-fA-F]{3,8})['\"]"))?.[1]

/** Les fautes sur les arrêts de dégradé d'un registre, thème par thème. */
function fautesDeDegrade(fichier: string): { nom: string; texte: string }[] {
  const out: { nom: string; texte: string }[] = []
  for (const m of readFileSync(join(ici, fichier), "utf8").matchAll(RE_THEME)) {
    const grad = m[0].match(RE_DEGRADE)
    if (!grad) continue
    const arrets = [...grad[1].matchAll(/#[0-9a-fA-F]{6}/g)].map(x => x[0])
    for (const champ of ["text", "muted", "primary"]) {
      const c = couleurDe(m[0], champ)
      if (!c) continue
      for (const a of arrets)
        if (contraste(c, a) < 4.5) out.push({ nom: m[1], texte: `${m[1]} : ${champ} ${c} sur l'arrêt ${a} = ${contraste(c, a).toFixed(2)}:1` })
    }
  }
  return out
}

describe("contraste des thèmes (WCAG AA, texte normal)", () => {
  it("les trois registres sont bien lus", () => {
    // Garde-fou : si un jour le format des thèmes change, ce test ne doit pas
    // devenir silencieusement vide et laisser passer n'importe quoi.
    expect(TOUS.length).toBeGreaterThanOrEqual(35)
    for (const [f, k] of REGISTRES) expect(themesDe(f, k).length, f).toBeGreaterThan(0)
  })

  it("le texte principal se lit sur le fond ET sur les surfaces", () => {
    const fautifs = ACTIFS.flatMap(t => [["fond", t.bg], ["surface", t.surface]]
      .filter(([, f]) => contraste(t.text, f) < 4.5)
      .map(([ou, f]) => `${t.nom} : texte ${t.text} sur ${ou} ${f} = ${contraste(t.text, f).toFixed(2)}:1`))
    expect(fautifs).toEqual([])
  })

  it("le texte secondaire aussi — c'est lui qui porte les descriptions", () => {
    const fautifs = ACTIFS.flatMap(t => [["fond", t.bg], ["surface", t.surface]]
      .filter(([, f]) => contraste(t.muted, f) < 4.5)
      .map(([ou, f]) => `${t.nom} : muted ${t.muted} sur ${ou} ${f} = ${contraste(t.muted, f).toFixed(2)}:1`))
    expect(fautifs).toEqual([])
  })

  it("la couleur principale aussi — c'est elle qui porte les prix", () => {
    const fautifs = ACTIFS.flatMap(t => [["fond", t.bg], ["surface", t.surface]]
      .filter(([, f]) => contraste(t.primary, f) < 4.5)
      .map(([ou, f]) => `${t.nom} : primary ${t.primary} sur ${ou} ${f} = ${contraste(t.primary, f).toFixed(2)}:1`))
    expect(fautifs).toEqual([])
  })

  it("les dégradés aussi : un fond dégradé a deux extrémités", () => {
    // Un thème en `bgGradient` ne peint jamais la couleur `bg` telle quelle.
    // Le texte doit tenir sur les DEUX arrêts, pas seulement sur la valeur à plat.
    const fautifs = REGISTRES.flatMap(([f]) => fautesDeDegrade(f).map(x => x.texte))
    expect(fautifs).toEqual([])
  })

  it("les 152 thèmes de l'éditeur sont tous lus — aucun n'échappe à la règle", () => {
    // Un thème dont une couleur n'est pas en hex sortirait du compte sans bruit.
    const editeur = themesDe("editorPresets.ts", "bg")
    expect(editeur.length).toBeGreaterThanOrEqual(152)
    expect(new Set(editeur.map(t => t.nom)).size).toBe(editeur.length)
  })

  it("le calcul de contraste est juste", () => {
    // Repères connus : noir sur blanc = 21:1, une couleur sur elle-même = 1:1,
    // et le gris #767676 sur blanc est le cas limite classique de l'AA.
    expect(contraste("#000000", "#FFFFFF")).toBeCloseTo(21, 5)
    expect(contraste("#C9A84C", "#C9A84C")).toBeCloseTo(1, 5)
    expect(contraste("#767676", "#FFFFFF")).toBeGreaterThanOrEqual(4.5)
    expect(contraste("#777777", "#FFFFFF")).toBeLessThan(4.6)
  })
})
