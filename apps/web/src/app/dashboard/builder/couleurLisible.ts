// couleurLisible.ts — une couleur de sens, posée sur le fond du client.
//
// Relevé du 11 septembre, balayage de contraste sur les 34 pages de démonstration
// rendues par le moteur public. Sur les modèles à fond clair (Menthe, Mocha,
// Lin…), la page publiée affichait :
//   « Ouvert · ferme à 19h »        vert #39FF8F sur #F2FAF8 → 1,1 : 1
//   « Nouveaux patients acceptés »  idem                      → 1,17 : 1
//   « Produits bio »                or  #C9A84C sur #FFF8F0   → 1,9 : 1
// Le minimum lisible est 4,5 : 1. Le client ne voyait rien de tout cela dans
// l'éditeur — son aperçu est à l'échelle, et l'œil complète — mais son client à
// lui, devant la vitrine, avait un badge blanc sur blanc.
//
// La cause n'est pas une faute de goût : ces couleurs sont écrites en dur dans
// le produit (statuts d'ouverture, stock, pastilles de mots-clés). Elles ont été
// choisies pour le fond noir de QRowg, et sorties telles quelles sur un thème
// que le client, lui, a choisi clair.
//
// La règle : une couleur de SENS (vert = ouvert, rouge = fermé) doit garder son
// sens et devenir lisible. On conserve donc la teinte et on déplace la clarté
// jusqu'à atteindre le rapport demandé. Module PUR, sans React, testable seul.

/** Le rapport minimal pour un texte courant (WCAG AA). */
export const CONTRASTE_MIN = 4.5
/** Celui d'un grand texte, ou d'une pastille de couleur non textuelle. */
export const CONTRASTE_MIN_GRAND = 3
/**
 * Marge ajoutée quand on corrige une couleur : un badge pose souvent sa propre
 * teinte translucide entre le texte et la carte, et ce voile mange du contraste
 * que le calcul sur la carte seule ne voit pas. Mesuré : viser 4,5 exactement
 * donnait 4,48 au navigateur.
 */
export const MARGE_VOILE = 0.6

type RVB = [number, number, number]

export function versRvb(hex: string): RVB | null {
  const h = hex.trim().replace(/^#/, "")
  const court = h.length === 3 || h.length === 4
  const long = h.length === 6 || h.length === 8
  if (!court && !long) return null
  const par = court ? 1 : 2
  const lit = (i: number) => {
    const m = h.slice(i * par, i * par + par)
    if (!/^[0-9a-fA-F]+$/.test(m)) return NaN
    return parseInt(court ? m + m : m, 16)
  }
  const v: RVB = [lit(0), lit(1), lit(2)]
  return v.some(Number.isNaN) ? null : v
}

const versHex = ([r, g, b]: RVB) =>
  "#" + [r, g, b].map(v => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0")).join("")

/** Luminance relative WCAG. */
export function luminance([r, g, b]: RVB): number {
  const f = (c: number) => { const x = c / 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4) }
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}

/** Rapport de contraste entre deux couleurs, de 1 (identiques) à 21 (noir/blanc). */
export function contraste(a: string, b: string): number | null {
  const x = versRvb(a), y = versRvb(b)
  if (!x || !y) return null
  const [hi, lo] = [luminance(x), luminance(y)].sort((p, q) => q - p)
  return (hi + 0.05) / (lo + 0.05)
}

// ── HSL, pour ne déplacer que la clarté ──────────────────────────────────────
function versHsl([r, g, b]: RVB): [number, number, number] {
  const R = r / 255, V = g / 255, B = b / 255
  const max = Math.max(R, V, B), min = Math.min(R, V, B)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h: number
  if (max === R) h = ((V - B) / d + (V < B ? 6 : 0))
  else if (max === V) h = (B - R) / d + 2
  else h = (R - V) / d + 4
  return [h * 60, s, l]
}

function depuisHsl([h, s, l]: [number, number, number]): RVB {
  if (s === 0) { const v = Math.round(l * 255); return [v, v, v] }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  const f = (t: number) => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }
  const H = h / 360
  return [f(H + 1 / 3) * 255, f(H) * 255, f(H - 1 / 3) * 255]
}

/**
 * Rend `couleur` lisible sur `fond` en gardant sa teinte : on assombrit sur un
 * fond clair, on éclaircit sur un fond sombre, par pas de 1 % de clarté, jusqu'à
 * atteindre `min`. Si la teinte n'y suffit pas (un jaune pur sur blanc), on finit
 * au noir ou au blanc — lisible avant d'être joli.
 *
 * Une couleur déjà lisible est rendue telle quelle : on ne touche à rien sans
 * raison, et le thème du client reste le sien.
 */
export function surFond(couleur: string, fond: string, min: number = CONTRASTE_MIN): string {
  const c = versRvb(couleur), f = versRvb(fond)
  if (!c || !f) return couleur
  const actuel = contraste(couleur, fond)
  if (actuel != null && actuel >= min) return couleur

  const fondClair = luminance(f) > 0.18
  const [h, s] = versHsl(c)
  let [, , l] = versHsl(c)
  const pas = fondClair ? -0.01 : 0.01
  for (let i = 0; i < 100; i++) {
    l += pas
    if (l <= 0 || l >= 1) break
    const essai = versHex(depuisHsl([h, s, l]))
    const r = contraste(essai, fond)
    if (r != null && r >= min) return essai
  }
  return fondClair ? "#000000" : "#FFFFFF"
}

/**
 * L'encre à poser SUR une couleur : le produit écrivait « blanc » partout, quelle
 * que soit la couleur choisie par le client. Sur la terracotta du modèle Pizzeria
 * (#E2603F), le blanc donne 3,5 : 1 — sous le seuil — quand le noir donne 6,0.
 *
 * On choisit donc celle des deux qui contraste le mieux, en restant dans les tons
 * du produit : une encre presque noire, une encre presque blanche.
 */
export const ENCRE_SOMBRE = "#0A0A0A"
export const ENCRE_CLAIRE = "#FFFFFF"

export function encreSur(fond: string): string {
  const sombre = contraste(ENCRE_SOMBRE, fond)
  const clair = contraste(ENCRE_CLAIRE, fond)
  if (sombre == null || clair == null) return ENCRE_CLAIRE
  return sombre >= clair ? ENCRE_SOMBRE : ENCRE_CLAIRE
}
