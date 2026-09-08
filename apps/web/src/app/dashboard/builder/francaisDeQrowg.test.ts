import { describe, it, expect } from "vitest"
import { readFileSync, readdirSync, statSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

// ═══════════════════════════════════════════════════════════════════════════════
// LE FRANÇAIS DE QROWG.
//
// Le commerçant écrit ses propres textes ; QRowg n'y touche pas. Mais QRowg écrit
// aussi les siens : les libellés de repli (« Réserver un créneau »), les états
// (« Épuisé »), les intitulés du panneau de réglages. Ceux-là, c'est la maison
// qui les signe — et ils étaient amputés de leurs accents à une dizaine
// d'endroits, dont trois publiés au visiteur :
//
//   « Ecouter sur Spotify »   sur chaque page d'artiste avec un bloc Spotify
//   « Epuise »                le badge d'un produit en rupture — à côté d'un
//                             bouton « Épuisé », correctement accentué, lui
//   « Réserver un creneau »   le bouton de prise de rendez-vous
//
// et le reste dans le panneau que le commerçant lit toute la journée :
// « Champ telephone », « Affiche la rarete », « Offre speciale ou reduction ».
//
// Un accent manquant n'est pas une coquille sans conséquence : c'est la seule
// chose que le visiteur puisse juger de la maison avant d'acheter.
//
// Même chose pour l'apostrophe : « plateformes d écoute », « Type d événement ».
// ═══════════════════════════════════════════════════════════════════════════════

const ICI = dirname(fileURLToPath(import.meta.url))

function sources(racine: string): Array<[string, string]> {
  const out: Array<[string, string]> = []
  const marcher = (d: string) => {
    for (const n of readdirSync(d).sort()) {
      const p = join(d, n)
      if (statSync(p).isDirectory()) { if (n !== "node_modules") marcher(p); continue }
      if (!/\.tsx?$/.test(n) || /\.test\./.test(n)) continue
      out.push([p, readFileSync(p, "utf8")])
    }
  }
  marcher(racine)
  return out
}

// Les surfaces où QRowg parle : le panneau de réglages, l'aperçu du builder, le
// renderer partagé, la page publiée.
const FICHIERS: Array<[string, string]> = [
  ...sources(ICI),
  ...sources(join(ICI, "..", "..", "[slug]")),
].filter(([p]) => !/[/\\]e2e-harness[/\\]/.test(p))

/** Le texte que QRowg AFFICHE : nœuds JSX, replis, intitulés du panneau. */
function textesAffiches(source: string): string[] {
  const src = source.replace(/\/\/[^\n]*/g, "").replace(/\/\*[\s\S]*?\*\//g, "")
  const out = new Set<string>()
  for (const m of src.matchAll(/>\s*([A-Za-zÀ-ÿ][^<>{}\n]{1,70}?)\s*</g)) out.add(m[1].trim())
  for (const m of src.matchAll(/\|\|\s*"([^"\n]{2,70})"/g)) out.add(m[1])
  for (const m of src.matchAll(/\b(?:label|hint|description|placeholder|sub|title|subject)\s*[:=]\s*"([^"\n]{2,90})"/g)) out.add(m[1])
  return [...out]
}

// Mots que QRowg emploie et qui portent un accent en français. La liste ne
// cherche pas l'exhaustivité : elle fige ce qui a été trouvé et ce qui reviendrait.
const SANS_ACCENT = new RegExp(
  "\\b(" + [
    "Epuise", "epuise", "rarete", "Rarete", "grise",
    "Reserver", "reserver", "creneau", "Creneau",
    "Ecouter", "ecouter", "evenement", "Evenement",
    "Telephone", "telephone", "Numero", "Categorie", "categorie",
    "speciale", "Speciale", "reduction", "Reduction",
    "Details", "Securise", "securise", "Verifie", "Duree", "Modele",
    "Ferme(?!e)", "Prefere", "Etape", "Recu", "Envoye", "affiche(?= *\"| *$)",
  ].join("|") + ")\\b",
)

// L'apostrophe avalée : « d écoute », « Type d événement », « S inscrire ».
// La lettre élidée doit être ISOLÉE. Un `\b` ne suffit pas : en JavaScript sans
// le drapeau `u`, « é » n'est pas un caractère de mot, donc `\bs ` mordait sur
// « numérotés avec ». On exige donc un vrai blanc (ou un début) devant.
const APOSTROPHE_AVALEE = /(?:^|[\s(«"'])(?:[dlmnsctj]|qu) (?:a|e|i|o|u|é|è|ê|h|y)[a-zàâçéèêëîïôûùüÿ]{2,}/

describe("QRowg ecrit un francais correct", () => {
  it("le detecteur repere bien un accent manquant", () => {
    expect(SANS_ACCENT.test("Ecouter sur Spotify")).toBe(true)
    expect(SANS_ACCENT.test("Écouter sur Spotify")).toBe(false)
    expect(SANS_ACCENT.test("Affiche le nombre de visiteurs"), "« Affiche » est un verbe").toBe(false)
    expect(APOSTROPHE_AVALEE.test("plateformes d écoute")).toBe(true)
    expect(APOSTROPHE_AVALEE.test("plateformes d'écoute")).toBe(false)
    expect(APOSTROPHE_AVALEE.test("Nom / Organisation")).toBe(false)
    expect(APOSTROPHE_AVALEE.test("Type d'événement")).toBe(false)
    expect(APOSTROPHE_AVALEE.test("Type d événement")).toBe(true)
    // Le piège : « numérotés avec » n'est pas une élision, le « s » appartient au
    // mot précédent. C'est ce que le contrôle confondait à sa première écriture.
    expect(APOSTROPHE_AVALEE.test("Des points numérotés avec un titre")).toBe(false)
    expect(APOSTROPHE_AVALEE.test("Les espaces sont nettoyés automatiquement")).toBe(false)
  })

  it("aucun texte affiche ne perd ses accents", () => {
    const fautes: Record<string, string[]> = {}
    for (const [p, src] of FICHIERS) {
      const t = textesAffiches(src).filter(v => SANS_ACCENT.test(v))
      if (t.length) fautes[p.slice(p.indexOf("/src/") + 5)] = t.sort()
    }
    expect(fautes).toEqual({})
  })

  it("aucune apostrophe n'est avalee", () => {
    const fautes: Record<string, string[]> = {}
    for (const [p, src] of FICHIERS) {
      const t = textesAffiches(src).filter(v => APOSTROPHE_AVALEE.test(v))
      if (t.length) fautes[p.slice(p.indexOf("/src/") + 5)] = t.sort()
    }
    expect(fautes).toEqual({})
  })

  it("le releve porte sur une vraie surface", () => {
    // Sans ce garde-fou, une erreur de chemin ferait passer le contrôle à vide.
    expect(FICHIERS.length).toBeGreaterThan(150)
    expect(FICHIERS.some(([p]) => p.endsWith("blockDefs.ts"))).toBe(true)
    expect(FICHIERS.some(([p]) => p.endsWith("renduLegacy.tsx"))).toBe(true)
  })
})
