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

// ── Les thèmes de l'éditeur : une dette connue, à cliquet (point 6, lot 1 — 25 nov.) ──
//
// Jusqu'au 25 nov., cette garde lisait `themes.ts` — un fichier mort, que plus
// rien n'affichait — au lieu de `editorPresets.ts`, qui porte les 152 thèmes
// que l'éditeur propose VRAIMENT. Rebranchée sur le bon fichier, elle a trouvé
// les thèmes ci-dessous sous le seuil : le produit les propose, puis son
// alerte d'avant publication (themeLisible.ts) les déclare illisibles.
//
// Leur correction est un lot à part (couleurs visibles, QA à l'œil). D'ici là,
// la liste est un CLIQUET : aucun nouveau thème ne peut y entrer, et un thème
// corrigé doit en sortir (test plus bas). Elle ne fait que rétrécir.
// 114 thèmes sur 152 au 25 nov.
const DETTE_EDITEUR = new Set<string>([
  "Épuré Clair", "Corporate Navy", "Black Diamond", "Bloomberg Dark", "Finance Elite", "Silicon Office",
  "Consulting Blue", "Dark Architect", "Navy Gold Prestige", "Velvet Noir", "Golden Luxury", "Royal Purple",
  "Pearl White", "Champagne", "Monaco Nights", "Black Card", "Emerald Palace", "Diamond Dust",
  "Midnight Velvet", "Ivory Gold", "Obsidian Luxury", "Saphir Bleu", "Electric Neon", "Cyber Punk",
  "YouTube Studio", "Twitch Night", "Viral Neon", "Future Stream", "Instagram Aesthetic", "Retro Wave",
  "Hype Orange", "Matrix Glitch", "Deep Space", "SaaS Blue", "Matrix Code", "Stripe Inspired",
  "Linear Dark", "Notion Light", "AI Future", "Cloud Native", "Product Hunt", "Growth Dark",
  "Sunset Fire", "Bistro Rouge", "Coffee House", "Garden Fresh", "Michelin Gold", "Tokyo Sushi",
  "Italian Trattoria", "Steak House", "Wine Cellar", "Boulangerie", "Thai Spice", "Nordic Cafe",
  "Rooftop Bar", "Prestige Immo", "Coastal Living", "Manhattan Premium", "Villa Prestige", "Modern Architecture",
  "Provence Stone", "Sotheby", "The Hamptons", "Tokyo Modern", "Luxury Penthouse", "Power Red",
  "Zen Wellness", "Orange Boost", "Spartan", "Beast Mode", "Elite Performance", "Yoga Sunrise",
  "Green Machine", "Aqua Swim", "Festival Night", "Celebration", "Corporate Event", "Wedding",
  "Luxury Wedding", "VIP Gala", "Fashion Week", "Rooftop Party", "Summer Festival", "Art Opening",
  "Charity Gala", "Rose Luxe", "Vinyl Club", "Cherry Blossom", "Synthwave", "Piano Lounge",
  "Jazz Club", "Lo-Fi Chill", "Metal Heavy", "Pop Art Music", "Pure White", "Minimal Cream",
  "Ocean Deep", "Candy Pop", "Forest Zen", "Behance Minimal", "Designer Grid", "Museum",
  "Editorial Cream", "Pastel Dream", "Neon Portfolio", "QRf Aurora Night", "QRf Crimson Silk", "QRf Ivory Noir",
  "QRf Deep Ocean", "QRf Sunset Mesh", "QRf Matrix Gold", "QRf Void Purple", "QRf Paper Ink", "QRf Neon Future",
])
const toleree = (t: Theme) => t.fichier === "editorPresets.ts" && DETTE_EDITEUR.has(t.nom)
const ACTIFS = TOUS.filter(t => !toleree(t))
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
    const fautifs = REGISTRES.flatMap(([f]) => fautesDeDegrade(f)
      .filter(x => !(f === "editorPresets.ts" && DETTE_EDITEUR.has(x.nom)))
      .map(x => x.texte))
    expect(fautifs).toEqual([])
  })

  it("la dette de l'éditeur ne fait que rétrécir : un thème corrigé sort de la liste", () => {
    const editeur = themesDe("editorPresets.ts", "bg")
    const noms = editeur.map(t => t.nom)
    expect(new Set(noms).size, "deux thèmes de même nom rendraient la liste ambiguë").toBe(noms.length)
    const surDegrade = new Set(fautesDeDegrade("editorPresets.ts").map(x => x.nom))
    const faute = (t: Theme) => surDegrade.has(t.nom)
      || [t.text, t.muted, t.primary].some(c => contraste(c, t.bg) < 4.5 || contraste(c, t.surface) < 4.5)
    const perimes = [...DETTE_EDITEUR].filter(n => { const t = editeur.find(e => e.nom === n); return !t || !faute(t) })
    expect(perimes, "thèmes corrigés ou disparus : retire-les de DETTE_EDITEUR").toEqual([])
    // Pour remplir la liste la première fois — jamais pour l'agrandir.
    if (process.env.RELEVE_DETTE) console.log("DETTE", JSON.stringify(editeur.filter(faute).map(t => t.nom)))
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
