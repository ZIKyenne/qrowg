// Une ligne d'espaces n'est pas une ligne, et ce qui décide est à un seul endroit — garde de classe.
//
// Deux défauts trouvés en préparant l'inversion du miroir (suite des lots v151
// et v152). Ils se tiennent, et c'est pour cela qu'ils sont dans le même lot.
//
// ── 1. Une ligne d'espaces passait pour une ligne ────────────────────────────
//
// La règle est écrite depuis longtemps, en tête de `blockEmptyState.ts` :
//
//     « une ligne blanche, un item "fantôme" (espaces seuls) ne sont PAS du
//       contenu publiable »
//
// Le produit la suivait **une fois sur deux** : quinze filtres d'emplacement
// lisaient `String(src[k] || "").trim()`, quinze autres se contentaient de la
// vérité JavaScript —
//
//     cc[`b${i}_label`] ? { icon: …, label: … } : null
//
// — et `"   "` est vrai. Sur la page publiée, cela donne une puce vide, une
// carte sans titre, un badge sans texte : le commerçant a appuyé sur espace, et
// sa page a gagné une ligne qu'il ne voit pas dans son panneau.
//
// ── 2. Le miroir servait de source à ce qu'il était censé refléter ───────────
//
// Onze modèles publics décidaient de leur visibilité en appelant… le détecteur
// d'état vide de l'ÉDITEUR :
//
//     visible: hasPublishableContent("merch", c)
//
// Or ce module promet, dans sa première ligne, d'être « le miroir EXACT du
// filtre public ». Un miroir qui sert de source ne reflète plus rien : il n'y
// avait plus de côté public à comparer. Et ces onze modèles calculaient déjà
// leurs items, juste au-dessus — la réponse était là, deux lignes plus haut.
//
// `visible: items.length > 0`. Ce qui décide est à un seul endroit, et c'est le
// rendu. Le détecteur redevient ce qu'il dit être.
//
// **Les deux défauts sont liés** : couper le cercle sans faire trimer les
// filtres aurait changé le produit — `"   "` serait devenu publiable, parce que
// `items` le gardait quand `hasPublishableContent` le refusait. C'est le test
// des fixtures « espaces seuls » qui l'a montré, à la première tentative.

import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"
import { texteUtile } from "./models/repeaterExtract"
import { trustBadgeViewModel } from "./models/trustBadge"
import { lineupViewModel } from "./models/lineup"
import { engagementsViewModel } from "./models/engagements"
import { valuesViewModel } from "./models/values"
import { merchViewModel } from "./models/merch"
import { statsBlockViewModel } from "./models/statsBlock"
import { processStepsViewModel } from "./models/processSteps"
import { onSiteServicesViewModel } from "./models/onSiteServices"
import { eventProgramViewModel } from "./models/eventProgram"
import { testimonialsViewModel } from "./models/testimonials"
import { reassuranceViewModel } from "./models/reassurance"

const RACINE = __dirname

function fichiers(): string[] {
  const out: string[] = []
  const marcher = (d: string) => {
    for (const n of fs.readdirSync(d).sort()) {
      const p = path.join(d, n)
      if (fs.statSync(p).isDirectory()) { if (n !== "e2e-harness") marcher(p) }
      else if (/\.tsx?$/.test(n) && !/\.test\./.test(n)) out.push(p)
    }
  }
  marcher(RACINE)
  return out
}

/**
 * Un filtre d'emplacement qui garde une valeur sans la nettoyer : la première
 * ligne du corps de `extractIndexed` teste la clé brute.
 *
 *     extractIndexed(c, N, (cc, i) => cc[`b${i}_label`] ? { … } : null)
 *                                     ^^^^^^^^^^^^^^^^^^^
 */
const FILTRE_BRUT = /extractIndexed(?:<[^>]*>)?\([^,]+,[^,]+,\s*\(\w+, \w+\) =>\s*\w+\[`[^`]+`\]\s*\?/g

/** Ce qui compte comme un vrai nettoyage : la fonction partagée, ou un `.trim()`. */
const NETTOYE = /texteUtile\(|\.trim\(\)/

describe("garde de classe : une ligne d'espaces n'est pas une ligne", () => {
  it("aucun filtre d'emplacement ne garde une valeur brute", () => {
    const fautifs: string[] = []
    for (const f of fichiers()) {
      const rel = path.relative(RACINE, f).split(path.sep).join("/")
      for (const m of fs.readFileSync(f, "utf8").matchAll(FILTRE_BRUT))
        fautifs.push(`${rel} → ${m[0].slice(-40)}`)
    }
    expect(fautifs, "passer par texteUtile()").toEqual([])
  })

  it("le détecteur sait dire oui — sinon il ne dirait jamais non", () => {
    const voit = (l: string) => new RegExp(FILTRE_BRUT.source).test(l)
    expect(voit('extractIndexed<T>(c, plafondDesLignes("x"), (cc, i) => cc[`b${i}_label`] ? { a: 1 } : null)'),
      "la forme d'avant").toBe(true)
    expect(voit('extractIndexed<T>(c, plafondDesLignes("x"), (cc, i) => texteUtile(cc[`b${i}_label`]) ? { a: 1 } : null)'),
      "la forme d'après").toBe(false)
    expect(NETTOYE.test('String(src[`i${i}`] || "").trim()'), "l'autre façon, déjà dans le produit").toBe(true)
  })

  it("…et le balayage voit bien la population", () => {
    let n = 0
    for (const f of fichiers()) n += [...fs.readFileSync(f, "utf8").matchAll(/extractIndexed(?:<[^>]*>)?\(/g)].length
    expect(n, "des extractions d'emplacements dans le produit").toBeGreaterThan(30)
  })

  it("texteUtile dit ce qu'il promet, et rien de plus", () => {
    expect(texteUtile("   ")).toBe("")
    expect(texteUtile("")).toBe("")
    expect(texteUtile(null)).toBe("")
    expect(texteUtile(undefined)).toBe("")
    expect(texteUtile("  Wi-Fi  "), "les espaces autour partent").toBe("Wi-Fi")
    expect(texteUtile(0), "un zéro est un texte, pas un vide").toBe("0")
  })
})

describe("exécuté : une ligne d'espaces ne publie rien", () => {
  const CAS: [string, (c: Record<string, string>) => { visible: boolean; items: unknown[] }, string][] = [
    ["trust_badge", c => trustBadgeViewModel(c), "b1_label"],
    ["lineup", c => lineupViewModel(c), "a1_name"],
    ["engagements", c => engagementsViewModel(c), "e1"],
    ["values", c => valuesViewModel(c), "v1_label"],
    ["merch", c => merchViewModel(c), "name1"],
    ["stats_block", c => statsBlockViewModel(c), "s1_value"],
    ["process_steps", c => processStepsViewModel(c), "s1_title"],
    ["on_site_services", c => onSiteServicesViewModel(c), "s1_label"],
    ["event_program", c => eventProgramViewModel(c), "s1_title"],
    ["testimonials", c => testimonialsViewModel(c), "name1"],
    ["reassurance", c => reassuranceViewModel(c), "g1_label"],
  ]

  it("des espaces seuls : invisible, zéro item", () => {
    for (const [nom, vm, cle] of CAS) {
      const r = vm({ [cle]: "   " })
      expect(r.items.length, `${nom} : une ligne fantôme`).toBe(0)
      expect(r.visible, `${nom} : visible malgré une ligne fantôme`).toBe(false)
    }
  })

  it("…et une vraie valeur publie toujours — rien n'a été retiré", () => {
    for (const [nom, vm, cle] of CAS) {
      const r = vm({ [cle]: "Wi-Fi" })
      expect(r.items.length, nom).toBeGreaterThan(0)
      expect(r.visible, nom).toBe(true)
    }
  })
})

describe("garde de classe : le miroir ne sert plus de source", () => {
  it("aucun modèle du rendu ne demande son avis au détecteur de l'éditeur", () => {
    const fautifs: string[] = []
    for (const f of fichiers()) {
      const src = fs.readFileSync(f, "utf8")
      if (/from "\.\.\/\.\.\/blockEmptyState"|from "\.\.\/blockEmptyState"/.test(src)
        && /hasPublishableContent/.test(src) && /\/models\//.test(f))
        fautifs.push(path.relative(RACINE, f).split(path.sep).join("/"))
    }
    expect(fautifs, "un modèle décide de sa visibilité lui-même").toEqual([])
  })

  it("les onze la décident depuis leurs propres items", () => {
    for (const m of ["trustBadge", "concerts", "lineup", "onSiteServices", "engagements", "values",
      "eventProgram", "merch", "statsBlock", "discography", "processSteps"]) {
      const src = fs.readFileSync(path.join(RACINE, "models", `${m}.ts`), "utf8")
      expect(src, `${m} : la visibilité vient de ses items`).toContain("visible: items.length > 0")
      expect(src, `${m} : et plus du détecteur de l'éditeur`).not.toContain("hasPublishableContent")
    }
  })

  it("…mais l'équivalence des lots v151 et v152 tient toujours", () => {
    // Le sens qui reste : le DÉTECTEUR reflète le rendu. `blockEmptyState` peut
    // donc citer un modèle ; c'est l'inverse qui est interdit. La garde exécutée
    // du lot v152 vérifie l'accord des deux côtés, champ par champ.
    const bes = fs.readFileSync(path.join(RACINE, "..", "blockEmptyState.ts"), "utf8")
    expect(bes).toContain("miroir EXACT du filtre public")
    expect(fs.existsSync(path.join(RACINE, "verdictQuiSaccorde.test.tsx"))).toBe(true)
  })
})
