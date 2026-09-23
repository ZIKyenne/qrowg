// ceQuiEstAccepteEstInerte — audit de sécurité du 23 septembre 2026.
//
// ── Le relevé ──────────────────────────────────────────────────────────────
//
// Le bucket `page-assets` est PUBLIC en lecture. Tout fichier déposé y reçoit
// une URL `…supabase.co/storage/v1/object/public/…` qui le sert avec son type
// réel. Un format qui porte du script — SVG, HTML — s'exécute donc dès qu'on
// ouvre cette URL. Affiché dans une `<img>`, il ne s'exécute pas : le risque
// n'est pas la page du commerçant, c'est l'URL elle-même, qui permettrait
// d'héberger une page d'hameçonnage sous une adresse ayant l'air d'appartenir
// au produit.
//
// `image/svg+xml` était accepté à l'envoi. Le relevé en base a tranché : trois
// mois, 421 fichiers, **zéro SVG**. Le format était accepté sans que personne
// s'en serve — on a retiré une surface, pas une fonction.
//
// ── Ce que cette garde vérifie ─────────────────────────────────────────────
//
// Elle ne part d'aucune liste écrite à la main de « ce qu'on accepte ». Elle
// LIT les trois endroits où le produit décide, et vérifie qu'aucun format actif
// n'y figure. La seule liste déclarée ici est celle des formats ACTIFS — ce que
// sait un navigateur, pas ce que fait ce produit — et les dérogations.
//
// ── La dérogation, et pourquoi elle se vérifie elle-même ───────────────────
//
// Le PDF porte du script lui aussi, et il reste accepté : un menu de restaurant
// en PDF est la raison d'être du produit. La dérogation est donc écrite. Mais
// une dérogation qu'on n'interroge pas finit par mentir (lot v175) : la garde
// exige que chaque dérogation corresponde à un format RÉELLEMENT encore
// accepté. Le jour où le PDF disparaîtra des formats admis, cette ligne devra
// partir aussi — et le test le dira.

import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"

const RACINE = path.resolve(__dirname, "../../..")
const VALIDATION = path.join(__dirname, "validationEnvoi.ts")
const SOCIAL = path.join(RACINE, "app/api/social/upload/route.ts")

/**
 * Les types qu'un navigateur peut exécuter, ou qui embarquent un moteur de
 * script, quand ils sont servis depuis une origine publique. Cette liste
 * décrit le monde, pas ce produit : elle n'a pas à bouger quand le produit
 * change d'avis.
 */
const FORMATS_ACTIFS = new Set([
  "image/svg+xml",
  "text/html",
  "application/xhtml+xml",
  "application/xml",
  "text/xml",
  "application/pdf",
])

/** Un format actif qu'on garde SCIEMMENT, avec la raison. */
const DEROGATIONS: Record<string, string> = {
  "application/pdf":
    "Un menu, une carte, un tarif en PDF est l'usage principal du produit. Le PDF est servi pour être lu ou téléchargé, et les lecteurs PDF des navigateurs modernes n'exécutent pas son JavaScript. Le retirer enlèverait une fonction réellement utilisée — contrairement au SVG, dont le relevé a montré qu'il ne servait à personne.",
}

// ── Le relevé : ce que le produit accepte, lu dans le produit ──────────────

/** Déplie `/^image\/(jpeg|png|webp|gif|avif)$/i` en types complets. */
function typesDeLaRegex(src: string): string[] {
  const m = src.match(/const IMAGES\s*=\s*\/\^image\\\/\(([^)]+)\)\$\/i/)
  if (!m) throw new Error("IMAGES introuvable dans validationEnvoi.ts — la garde ne lit plus le produit")
  return m[1].split("|").map(s => "image/" + s.replace(/\\/g, ""))
}

/** Les clés d'un objet `const NOM: … = { "type": …, … }`. */
function clesDeLObjet(src: string, nom: string): string[] {
  const i = src.indexOf(`const ${nom}`)
  if (i < 0) throw new Error(`${nom} introuvable — la garde ne lit plus le produit`)
  const bloc = src.slice(i, src.indexOf("\n}", i))
  return [...bloc.matchAll(/"([a-z]+\/[a-z0-9.+-]+)"\s*:/gi)].map(m => m[1])
}

export function formatsAcceptes(): { type: string; ou: string }[] {
  const v = fs.readFileSync(VALIDATION, "utf8")
  const s = fs.readFileSync(SOCIAL, "utf8")
  return [
    ...typesDeLaRegex(v).map(type => ({ type, ou: "validationEnvoi.ts / IMAGES" })),
    ...clesDeLObjet(v, "DOCS").map(type => ({ type, ou: "validationEnvoi.ts / DOCS" })),
    ...clesDeLObjet(s, "ALLOWED").map(type => ({ type, ou: "api/social/upload / ALLOWED" })),
  ]
}

function actifsNonJustifies(acceptes = formatsAcceptes()) {
  return acceptes.filter(a => FORMATS_ACTIFS.has(a.type) && !DEROGATIONS[a.type])
}

describe("ce qui est accepté à l'envoi est inerte", () => {
  it("le relevé n'est pas vide, et il lit bien les trois endroits", () => {
    const a = formatsAcceptes()
    const sources = new Set(a.map(x => x.ou))
    expect(a.length).toBeGreaterThan(5)
    expect(sources.size).toBe(3)
    // Si l'extraction se met à ne plus rien voir, tout passerait : on ancre
    // sur un format dont la présence ne fait aucun doute.
    expect(a.map(x => x.type)).toContain("image/jpeg")
  })

  it("aucun format actif n'est accepté sans dérogation écrite", () => {
    expect(
      actifsNonJustifies().map(a => `${a.type} (${a.ou})`),
      "un format qui porte du script est accepté dans un bucket public en lecture",
    ).toEqual([])
  })

  it("le SVG en particulier n'est plus accepté nulle part", () => {
    expect(formatsAcceptes().map(a => a.type)).not.toContain("image/svg+xml")
  })

  it("chaque dérogation porte une raison, et vise un format encore accepté", () => {
    const acceptes = new Set(formatsAcceptes().map(a => a.type))
    for (const [type, raison] of Object.entries(DEROGATIONS)) {
      expect(raison.length, `la dérogation pour ${type} n'explique rien`).toBeGreaterThan(80)
      expect(acceptes.has(type), `dérogation périmée : ${type} n'est plus accepté nulle part`).toBe(true)
    }
  })

  it("contre-épreuve : un SVG réadmis serait vu", () => {
    const rechute = [...formatsAcceptes(), { type: "image/svg+xml", ou: "rechute" }]
    expect(actifsNonJustifies(rechute).map(a => a.type)).toContain("image/svg+xml")
  })
})
