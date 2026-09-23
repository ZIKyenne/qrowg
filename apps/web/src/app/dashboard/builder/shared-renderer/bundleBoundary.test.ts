import { describe, it, expect } from "vitest"
import fs, { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

// La frontière des bundles — et une garde qui nommait sa propre population.
//
// ── Ce que cette garde promettait, et ce qu'elle tenait ───────────────────
//
// « Le chemin PUBLIC ne doit importer aucun symbole éditeur. » Elle vérifiait
// cela sur une liste de fichiers **écrite à la main** — cent un noms, posés à
// la vague où chaque bloc était scindé en `PublicX.tsx` et `EditorX.tsx`.
//
// Depuis, les blocs s'écrivent en UN SEUL fichier, `index.tsx`, qui porte les
// deux adapters. Relevé du 23 septembre : **soixante-treize** de ces blocs
// importent `primitives/BlockEmptyState`, la primitive que la liste interdit —
// et **cinquante-neuf** ne sont pas nommés dans la liste. La garde ne les
// voyait pas. Le registre public, lui, atteint cent quarante-six modules de
// blocs ; la liste en nommait cent un.
//
// C'est la cause qui revient depuis le lot v159 : **une règle qui nomme sa
// propre population finit par ne plus dire la vérité.** Cette fois-ci dans une
// garde, ce qui est pire : une garde qui garde un échantillon rassure à tort.
// La population est donc CALCULÉE depuis `publicRegistry.tsx`, en suivant les
// imports relatifs — comme le lot v163 recalcule les adresses réservées depuis
// le dossier `app/`.
//
// ── Ce que la règle protège vraiment ──────────────────────────────────────
//
// Un fichier `PublicX.tsx` n'existe que pour le rendu publié : y importer du
// code d'éditeur le fait voyager avec le visiteur, et c'est la faute que cette
// garde existe pour empêcher. Un bloc mono-fichier, lui, porte les deux
// adapters par convention du produit : le morceau `EditorX` est retiré du
// paquet public par élagage des exports inutilisés (le registre importe le
// module et ne prend que `m.PublicX`). Exiger de lui qu'il n'écrive jamais
// d'état vide reviendrait à lui interdire de dire au commerçant pourquoi son
// bloc est vide — ce que soixante-treize blocs font déjà.
//
// La règle est donc écrite pour ce qu'elle protège :
//   · un module qui n'exporte QU'un adapter public → aucun symbole d'éditeur ;
//   · un module qui exporte aussi un adapter éditeur → l'état vide est admis,
//     et rien d'autre.

const read = (rel: string) => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), "utf8")
const ICI = path.dirname(fileURLToPath(import.meta.url))

/** Les modules que le registre public atteint, en suivant les imports relatifs. */
function atteignablesDepuisLePublic(): string[] {
  const vus = new Set<string>()
  const resoudre = (depuis: string, spec: string): string | null => {
    if (!spec.startsWith(".")) return null
    const base = path.resolve(path.dirname(depuis), spec)
    for (const c of [base, `${base}.tsx`, `${base}.ts`, path.join(base, "index.tsx"), path.join(base, "index.ts")])
      if (fs.existsSync(c) && fs.statSync(c).isFile()) return c
    return null
  }
  const marcher = (abs: string) => {
    if (vus.has(abs)) return
    vus.add(abs)
    const src = fs.readFileSync(abs, "utf8")
    for (const m of src.matchAll(/(?:from|import\()\s*["']([^"']+)["']/g)) {
      const suivant = resoudre(abs, m[1])
      if (suivant && !/\.test\./.test(suivant)) marcher(suivant)
    }
  }
  marcher(path.join(ICI, "publicRegistry.tsx"))
  return [...vus].map(f => path.relative(ICI, f).split(path.sep).join("/")).sort()
}

/** Ce module porte-t-il aussi l'adapter éditeur du bloc ? */
const porteLEditeur = (src: string) => /export function Editor\w+/.test(src)

/**
 * Un fichier de l'éditeur se DÉCLARE par son nom — `EditorImage.tsx`,
 * `EditorHeading.tsx`, `EditorTexte.tsx`. C'est la convention du produit, et
 * elle vaut déclaration : ces modules sont atteints depuis le registre parce
 * qu'un bloc mono-fichier les tire pour son adapter éditeur, jamais pour son
 * rendu public. Leur demander de ne pas importer d'éditeur n'aurait aucun sens.
 */
const estUnFichierDEditeur = (chemin: string) => /(^|\/)Editor[A-Z]\w*\.tsx$/.test(chemin)

// Symboles/chemins strictement éditeur qui ne doivent JAMAIS entrer dans le bundle public.
const FORBIDDEN_IN_PUBLIC = [
  "InlineEditable", "editorRegistry", "EditorHeading", "EditorValues", "EditorPricing",
  "BuilderV4", "builderHooks", "builderPanels", "OutlinePanel", "CommandPalette",
  "primitives/BlockEmptyState",
]
/** Admis dans un module mono-fichier : c'est ce qu'il dit au commerçant. */
const ADMIS_SI_MONO_FICHIER = ["primitives/BlockEmptyState"]

const ATTEIGNABLES = atteignablesDepuisLePublic()

describe("frontière de bundle — la population est calculée, plus écrite à la main", () => {
  it("le registre mène bien à tout le produit", () => {
    // Le plancher : une liste écrite à la main en nommait cent un ; le registre
    // atteint les cent quarante-six modules de blocs, plus leurs modèles et
    // leurs vues. Sans ce compte, un calcul qui ne trouverait plus rien ferait
    // passer la garde entière pour verte.
    expect(ATTEIGNABLES.length, "des modules atteints depuis le registre public").toBeGreaterThan(200)
    expect(ATTEIGNABLES.filter(f => /^blocks\/.*\/index\.tsx$/.test(f)).length, "des blocs mono-fichier").toBeGreaterThan(60)
    expect(ATTEIGNABLES, "et le registre lui-même").toContain("publicRegistry.tsx")
  })

  it("aucun fichier public-seul n'importe de code d'éditeur", () => {
    const fautes: string[] = []
    for (const f of ATTEIGNABLES) {
      if (estUnFichierDEditeur(f)) continue
      const src = read(`./${f}`)
      const imports = src.split("\n").filter(l => /^\s*import\b/.test(l)).join("\n")
      const admis = porteLEditeur(src) ? ADMIS_SI_MONO_FICHIER : []
      for (const bad of FORBIDDEN_IN_PUBLIC)
        if (imports.includes(bad) && !admis.includes(bad)) fautes.push(`${f} importe ${bad}`)
    }
    expect(fautes, "un fichier de rendu public ne voyage pas avec l'éditeur").toEqual([])
  })

  it("un module mono-fichier n'a droit qu'à l'état vide, et rien de plus", () => {
    // L'exception est nommée, et elle est étroite : `BlockEmptyState` est une
    // primitive de présentation de quinze lignes, sans dépendance d'éditeur.
    // Tout le reste de la liste reste interdit, y compris pour eux.
    const monoFichiers = ATTEIGNABLES.filter(f => /^blocks\/.*\/index\.tsx$/.test(f) && porteLEditeur(read(`./${f}`)))
    expect(monoFichiers.length, "des blocs qui portent les deux adapters").toBeGreaterThan(60)
    const avecEtatVide = monoFichiers.filter(f => read(`./${f}`).includes("primitives/BlockEmptyState"))
    expect(avecEtatVide.length, "et qui disent au commerçant pourquoi ils sont vides").toBeGreaterThan(70)
    for (const f of monoFichiers) {
      const imports = read(`./${f}`).split("\n").filter(l => /^\s*import\b/.test(l)).join("\n")
      for (const bad of FORBIDDEN_IN_PUBLIC.filter(b => !ADMIS_SI_MONO_FICHIER.includes(b)))
        expect(imports.includes(bad), `${f} importe ${bad}`).toBe(false)
    }
  })

  it("le balayage sait dire non — sinon il ne dirait jamais oui", () => {
    // Une faute injectée dans un fichier public-seul doit être vue. On l'éprouve
    // sur la règle elle-même, sans toucher au dépôt.
    const juger = (src: string) => {
      const imports = src.split("\n").filter(l => /^\s*import\b/.test(l)).join("\n")
      const admis = porteLEditeur(src) ? ADMIS_SI_MONO_FICHIER : []
      return FORBIDDEN_IN_PUBLIC.filter(b => imports.includes(b) && !admis.includes(b))
    }
    expect(juger('import { BlockEmptyState } from "../../primitives/BlockEmptyState"\nexport function PublicX() {}'),
      "un fichier public-seul : refusé").toEqual(["primitives/BlockEmptyState"])
    expect(juger('import { BlockEmptyState } from "../../primitives/BlockEmptyState"\nexport function EditorX() {}\nexport function PublicX() {}'),
      "un mono-fichier : admis").toEqual([])
    expect(juger('import { InlineEditable } from "../../InlineEditable"\nexport function EditorX() {}'),
      "…mais pas l'édition en place").toEqual(["InlineEditable"])
    expect(porteLEditeur("export function EditorFrameBox() {}")).toBe(true)
    expect(porteLEditeur("export function PublicFrameBox() {}")).toBe(false)
    // Et la convention de nom sait, elle aussi, dire non.
    expect(estUnFichierDEditeur("primitives/EditorTexte.tsx")).toBe(true)
    expect(estUnFichierDEditeur("blocks/heading/EditorHeading.tsx")).toBe(true)
    expect(estUnFichierDEditeur("primitives/TexteInline.tsx")).toBe(false)
    expect(estUnFichierDEditeur("blocks/about/index.tsx")).toBe(false)
    // Les fichiers d'éditeur existent bien, et ils sont atteints : sans eux,
    // l'exemption ne porterait sur rien.
    // Deux fichiers d'éditeur sont atteints depuis le registre — tirés par les
    // blocs mono-fichier pour leur adapter éditeur, jamais pour le rendu
    // public. Ce sont exactement ceux que l'exemption couvre ; les nommer vaut
    // mieux qu'un compte, qui ne dirait pas lesquels.
    expect(ATTEIGNABLES.filter(estUnFichierDEditeur).sort(), "ceux que l'exemption couvre")
      .toEqual(["primitives/EditorImage.tsx", "primitives/EditorTexte.tsx"])
  })
})

describe("modèles purs — sans React ni Supabase", () => {
  // Même correction : le dossier des modèles est LU, il n'est plus énuméré.
  const modeles = fs.readdirSync(path.join(ICI, "models")).filter(n => n.endsWith(".ts") && !/\.test\./.test(n)).sort()
  it("le dossier des modèles est bien lu", () => {
    expect(modeles.length, "des modèles").toBeGreaterThan(50)
  })
  for (const m of modeles) {
    it(`models/${m} : aucun import react/supabase`, () => {
      const imports = read(`./models/${m}`).split("\n").filter(l => /^\s*import\b/.test(l)).join("\n")
      expect(/from ["']react["']/.test(imports), `models/${m} importe react`).toBe(false)
      expect(/supabase/i.test(imports), `models/${m} importe supabase`).toBe(false)
      expect(imports.includes("trackLinkClick"), `models/${m} importe le tracking`).toBe(false)
    })
  }
})

describe("marqueurs de comportement des adapters", () => {
  it("PublicValues rend null si vide", () => {
    expect(read("./blocks/values/PublicValues.tsx").includes("return null")).toBe(true)
  })
  it("PublicPricing : lien <a> réel + tracking", () => {
    const src = read("./blocks/pricing/PublicPricing.tsx")
    expect(src.includes("<a ")).toBe(true)
    expect(src.includes("trackClick")).toBe(true)
  })
  it("EditorPricing : CTA non navigable (aria-disabled), pas de <a>", () => {
    const src = read("./blocks/pricing/EditorPricing.tsx")
    expect(src.includes('aria-disabled="true"')).toBe(true)
    expect(src.includes("<a ")).toBe(false)
  })
  it("EditorHeading / EditorValues : édition inline préservée", () => {
    expect(read("./blocks/heading/EditorHeading.tsx").includes("InlineEditable")).toBe(true)
    expect(read("./blocks/values/EditorValues.tsx").includes("InlineEditable")).toBe(true)
  })
})
