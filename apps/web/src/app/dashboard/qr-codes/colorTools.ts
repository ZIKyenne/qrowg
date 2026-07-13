// =============================================================================
// colorTools.ts — Moteur PUR du selecteur de couleurs (critique #14).
// Conversions hex <-> RGB <-> HSL, harmonies (complementaire / analogues /
// triade), normalisation d'une saisie, et gestion de l'historique de couleurs.
// Aucune dependance DOM -> entierement testable.
// =============================================================================

export type RGB = { r: number; g: number; b: number }   // 0..255
export type HSL = { h: number; s: number; l: number }    // h 0..360, s/l 0..100

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

// Normalise une saisie en "#RRGGBB" (majuscules), ou null si invalide.
// Accepte : "#abc", "abc", "#aabbcc", "aabbcc" (avec/sans #, casse libre).
export function normalizeHex(input: string): string | null {
  if (typeof input !== "string") return null
  let h = input.trim().replace(/^#/, "")
  if (h.length === 3) h = h.split("").map(c => c + c).join("")
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null
  return "#" + h.toUpperCase()
}

export function isValidHex(input: string): boolean {
  return normalizeHex(input) !== null
}

export function hexToRgb(hex: string): RGB | null {
  const n = normalizeHex(hex); if (!n) return null
  return { r: parseInt(n.slice(1, 3), 16), g: parseInt(n.slice(3, 5), 16), b: parseInt(n.slice(5, 7), 16) }
}

export function rgbToHex(rgb: RGB): string {
  const to = (v: number) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, "0")
  return ("#" + to(rgb.r) + to(rgb.g) + to(rgb.b)).toUpperCase()
}

export function rgbToHsl({ r, g, b }: RGB): HSL {
  const rn = r / 255, gn = g / 255, bn = b / 255
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn)
  const d = max - min
  let h = 0
  if (d !== 0) {
    if (max === rn) h = ((gn - bn) / d) % 6
    else if (max === gn) h = (bn - rn) / d + 2
    else h = (rn - gn) / d + 4
    h *= 60
    if (h < 0) h += 360
  }
  const l = (max + min) / 2
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1))
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) }
}

export function hslToRgb({ h, s, l }: HSL): RGB {
  const hn = ((h % 360) + 360) % 360, sn = clamp(s, 0, 100) / 100, ln = clamp(l, 0, 100) / 100
  const c = (1 - Math.abs(2 * ln - 1)) * sn
  const x = c * (1 - Math.abs((hn / 60) % 2 - 1))
  const m = ln - c / 2
  let r = 0, g = 0, b = 0
  if (hn < 60) { r = c; g = x } else if (hn < 120) { r = x; g = c }
  else if (hn < 180) { g = c; b = x } else if (hn < 240) { g = x; b = c }
  else if (hn < 300) { r = x; b = c } else { r = c; b = x }
  return { r: Math.round((r + m) * 255), g: Math.round((g + m) * 255), b: Math.round((b + m) * 255) }
}

export function hexToHsl(hex: string): HSL | null {
  const rgb = hexToRgb(hex); return rgb ? rgbToHsl(rgb) : null
}

export function hslToHex(hsl: HSL): string {
  return rgbToHex(hslToRgb(hsl))
}

// Decale la teinte d'un hex de `deg` degres (garde S/L).
// Un multiple de 360 renvoie exactement la couleur d'origine (pas de derive d'arrondi).
export function rotateHue(hex: string, deg: number): string {
  const norm = normalizeHex(hex) ?? "#000000"
  if ((((deg % 360) + 360) % 360) === 0) return norm
  const hsl = hexToHsl(norm); if (!hsl) return norm
  return hslToHex({ ...hsl, h: hsl.h + deg })
}

export type Harmonies = { complementary: string; analogous: string[]; triadic: string[] }

// Harmonies classiques a partir d'une couleur de base.
export function harmonies(hex: string): Harmonies {
  return {
    complementary: rotateHue(hex, 180),
    analogous: [rotateHue(hex, -30), rotateHue(hex, 30)],
    triadic: [rotateHue(hex, 120), rotateHue(hex, 240)],
  }
}

// Ajoute une couleur en tete de l'historique (dedupe, casse ignoree, plafonne).
export function pushRecent(list: string[], hex: string, max = 12): string[] {
  const n = normalizeHex(hex); if (!n) return list
  const rest = list.map(c => normalizeHex(c) ?? c).filter(c => c.toUpperCase() !== n)
  return [n, ...rest].slice(0, max)
}
