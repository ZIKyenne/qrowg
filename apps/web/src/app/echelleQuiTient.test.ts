// echelleQuiTient — lot v194.
//
// ── Le relevé ──────────────────────────────────────────────────────────────
//
// Audit complet du 27 septembre, 54 pages, iPhone 13. Tout était propre :
// zéro débordement horizontal, zéro image sans dimensions, zéro titre mal
// hiérarchisé, zéro lien sans libellé, zéro champ sans étiquette, zéro bouton
// sans nom, zéro métadonnée manquante, zéro `id` dupliqué.
//
// Deux chiffres trahissaient pourtant l'absence de système :
//
//   • **46 tailles de police écrites en dur**, dont neuf demi-pas : 8,5 · 9,5 ·
//     10,5 · 11,5 · 12,5 · 13,5 · 14,5 · 15,5 · 16,5.
//   • **25 rayons de bordure** : 1, 3, 5, 7, 8, 10, 11, 13, 15, 22, 24, 100…
//
// **Personne ne choisit entre 12,5 et 13 px.** Un demi-pixel ne se voit pas ;
// s'il est écrit, c'est qu'il a été copié d'ailleurs et ajusté à vue. C'est la
// signature d'une page composée valeur par valeur plutôt que sur une échelle —
// et c'est l'un des traits qui font dire « ça a été généré ».
//
// ── Ce que le lot a fait ───────────────────────────────────────────────────
//
// Les valeurs qui ont DÉRIVÉ rejoignent l'échelle ; celles qui ont été CHOISIES
// ne bougent pas. 16 px reste 16 px : c'est le seuil sous lequel iOS zoome
// (lot v185). 18 px reste 18. Aucun texte ne change de plus d'un pixel, sauf
// ceux qui étaient sous le plancher de lisibilité de 11 px.
//
// Résultat : **46 → 27 tailles, aucun demi-pas. 25 → 15 rayons.**
//
// ── Ce que cette garde tient ───────────────────────────────────────────────
//
// Un cliquet, comme celui des boutons (v182) et des champs (v185) : les
// nombres ne peuvent que descendre. Plus une règle absolue — aucun demi-pas —
// parce qu'un demi-pixel n'est jamais un choix.

import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"

const SRC = path.resolve(__dirname, "..")

/**
 * Le périmètre : tout ce qui n'est ni le tableau de bord, ni la page publiée
 * d'un commerçant, ni le banc d'essai.
 *
 * `dashboard/templates/page.tsx` fait exception : `/creer` le rend tel quel au
 * public. C'est la leçon du lot v193 — un périmètre qui suit les DOSSIERS rate
 * les fichiers qui vivent d'un côté et s'affichent de l'autre.
 */
function dansLePerimetre(rel: string): boolean {
  if (rel === "app/dashboard/templates/page.tsx") return true
  if (rel.startsWith("app/dashboard/")) return false
  if (rel.startsWith("app/[slug]/")) return false
  if (rel.startsWith("app/e2e-harness/")) return false
  if (/\.test\./.test(rel)) return false
  return true
}

function fichiers(): string[] {
  const out: string[] = []
  ;(function walk(d: string) {
    for (const e of fs.readdirSync(path.join(SRC, d), { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))) {
      const rel = d ? `${d}/${e.name}` : e.name
      if (e.isDirectory()) walk(rel)
      else if (/\.(tsx|css)$/.test(e.name)) out.push(rel)
    }
  })("")
  return out.filter(dansLePerimetre)
}

/** Toutes les tailles ÉCRITES. Les bornes d'un clamp comptent ; pas ce qu'il interpole. */
export function taillesEcrites() {
  const m = new Map<number, number>()
  const add = (v: number) => m.set(v, (m.get(v) ?? 0) + 1)
  for (const rel of fichiers()) {
    const s = fs.readFileSync(path.join(SRC, rel), "utf8")
    for (const x of s.matchAll(/fontSize:\s*(\d+(?:\.\d+)?)\b/g)) add(parseFloat(x[1]))
    for (const x of s.matchAll(/font-size:\s*(\d+(?:\.\d+)?)px/g)) add(parseFloat(x[1]))
    for (const x of s.matchAll(/clamp\((\d+(?:\.\d+)?)px,\s*[\d.]+vw,\s*(\d+(?:\.\d+)?)px\)/g)) {
      add(parseFloat(x[1])); add(parseFloat(x[2]))
    }
  }
  return m
}

/** Tous les rayons écrits. */
export function rayonsEcrits() {
  const m = new Map<number, number>()
  const add = (v: number) => m.set(v, (m.get(v) ?? 0) + 1)
  for (const rel of fichiers()) {
    const s = fs.readFileSync(path.join(SRC, rel), "utf8")
    for (const x of s.matchAll(/borderRadius:\s*(\d+(?:\.\d+)?)\b/g)) add(parseFloat(x[1]))
    for (const x of s.matchAll(/border-radius:\s*(\d+(?:\.\d+)?)px/g)) add(parseFloat(x[1]))
  }
  return m
}

/** Le plancher de lisibilité que le produit s'impose (relevé du lot v187). */
const PLANCHER = 11

/** Le cliquet. Relevé du 27 septembre, après alignement. Il ne remonte jamais. */
const PLAFOND_TAILLES = 27
const PLAFOND_RAYONS = 15

describe("les tailles et les rayons suivent une échelle", () => {
  it("le relevé lit bien le code (sinon il est aveugle)", () => {
    expect(fichiers().length, "plus aucun fichier dans le périmètre").toBeGreaterThan(40)
    expect(taillesEcrites().size, "plus aucune taille lue").toBeGreaterThan(10)
    expect(rayonsEcrits().size, "plus aucun rayon lu").toBeGreaterThan(5)
  })

  it("aucune taille n'est un demi-pas", () => {
    // Un demi-pixel ne se voit pas. S'il est écrit, il a été copié puis ajusté
    // à vue — jamais choisi.
    const demi = [...taillesEcrites().keys()].filter(v => v !== Math.trunc(v)).sort((a, b) => a - b)
    expect(demi, "une taille en demi-pixel est revenue ; alignez-la sur l'entier le plus proche").toEqual([])
  })

  it("aucun rayon n'est un demi-pas", () => {
    const demi = [...rayonsEcrits().keys()].filter(v => v !== Math.trunc(v)).sort((a, b) => a - b)
    expect(demi).toEqual([])
  })

  it("aucun texte ne descend sous le plancher de lisibilité", () => {
    // 11 px est le plus petit corps que le produit s'autorise. En dessous, le
    // lot v187 a montré que le contraste ne suffit plus à compenser.
    const sous = [...taillesEcrites().keys()].filter(v => v < PLANCHER).sort((a, b) => a - b)
    expect(sous, `du texte sous ${PLANCHER}px`).toEqual([])
  })

  it("le nombre de tailles ne remonte pas", () => {
    const n = taillesEcrites().size
    expect(n, `${n} tailles distinctes (plafond ${PLAFOND_TAILLES})`).toBeLessThanOrEqual(PLAFOND_TAILLES)
  })

  it("le nombre de rayons ne remonte pas", () => {
    const n = rayonsEcrits().size
    expect(n, `${n} rayons distincts (plafond ${PLAFOND_RAYONS})`).toBeLessThanOrEqual(PLAFOND_RAYONS)
  })

  it("aucun plafond ne reste au-dessus du réel", () => {
    // Sans ça, le cliquet se desserre en silence : on range dix valeurs, le
    // plafond garde l'ancien chiffre, et dix nouvelles peuvent revenir.
    const relaches: string[] = []
    if (taillesEcrites().size < PLAFOND_TAILLES) relaches.push(`tailles : ${taillesEcrites().size} réelles pour un plafond à ${PLAFOND_TAILLES}`)
    if (rayonsEcrits().size < PLAFOND_RAYONS) relaches.push(`rayons : ${rayonsEcrits().size} réels pour un plafond à ${PLAFOND_RAYONS}`)
    expect(relaches, "le cliquet s'est desserré — descendez le plafond").toEqual([])
  })

  it("16 px reste une taille du produit", () => {
    // Le seuil du zoom iOS (lot v185). Si l'échelle l'avalait, les champs
    // repasseraient sous le seuil et Safari zoomerait de nouveau.
    expect(taillesEcrites().has(16), "16 px a disparu de l'échelle : iOS zoomera").toBe(true)
  })

  // ── Contre-épreuves ──────────────────────────────────────────────────────

  it("un demi-pas réintroduit serait vu", () => {
    const faux = new Map([[13, 4], [13.5, 1]])
    expect([...faux.keys()].filter(v => v !== Math.trunc(v))).toEqual([13.5])
  })

  it("une valeur entière n'est pas prise pour un demi-pas", () => {
    const vrai = new Map([[11, 1], [12, 1], [999, 1]])
    expect([...vrai.keys()].filter(v => v !== Math.trunc(v))).toEqual([])
  })
})
