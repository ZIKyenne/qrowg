import { describe, it, expect } from "vitest"
import { readdirSync, readFileSync } from "node:fs"
import { join, extname } from "node:path"
import { RUPTURES, LARGEURS_CONNUES } from "./ruptures"

// ruptureUnique — le cliquet des ruptures de largeur. M02.
//
// ── Ce que cette garde a appris à ne pas dire ──────────────────────────────
//
// Mon premier relevé annonçait **44 ruptures**. Il comptait tous les
// `max-width:` du dépôt — y compris `max-width: 120px` sur une vignette et
// `min-width: 38px` sur un bouton, qui ne sont pas des ruptures mais des
// dimensions d'éléments. Deux mesures fausses dans la même journée (l'autre
// comptait les numéros d'étape comme des textes trop petits) : un compteur brut
// se trompe toujours dans le sens de l'alarme.
//
// Cette garde ne regarde donc QUE :
//   · le prélude d'une `@media`, jusqu'à l'accolade ;
//   · les valeurs passées à `useIsMobile(…)`.
//
// Et elle normalise l'idiome `min-width: N+1`, qui est la même frontière que
// `max-width: N` écrite de l'autre côté : 621 et 620 sont UNE rupture, pas deux.
// Sans cette normalisation, 620/621, 640/641, 899/900/901 et 1024/1025
// compteraient double et le chiffre serait, là encore, gonflé.
//
// Chiffre honnête au 5 octobre 2026 : **27 seuils**, dont **2** tombent déjà sur
// une des quatre ruptures. **25 à résorber.**
//
// ── Pourquoi un cliquet et pas une interdiction ────────────────────────────
//
// Interdire les 25 aujourd'hui demanderait de migrer 8 761 styles inline en un
// commit — un *rewrite* déguisé, qui casserait des écrans dont personne ne
// connaît plus les détails. Le cliquet encadre la dette sans exiger de la
// résorber d'un coup : elle ne peut que **baisser**. C'est le motif que le dépôt
// utilise déjà pour la taille des fichiers (`testsDeterministes.test.ts`), et il
// fonctionne.

const RACINE = join(__dirname, "..")
const EXTENSIONS = [".ts", ".tsx", ".css"]

function* fichiers(dossier: string): Generator<string> {
  // Trié : `testsDeterministes.test.ts` l'exige, et il a raison de l'exiger.
  // L'ordre de `readdirSync` dépend du système de fichiers ; un test qui en
  // dépend passe sur une machine et échoue sur une autre. Ici l'ordre ne change
  // pas le résultat (on agrège dans une Map), mais la règle vaut sans exception :
  // c'est la seule façon qu'elle reste vérifiable.
  const entrees = readdirSync(dossier, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))
  for (const e of entrees) {
    const chemin = join(dossier, e.name)
    if (e.isDirectory()) {
      if (e.name === "node_modules") continue
      yield* fichiers(chemin)
    } else if (EXTENSIONS.includes(extname(e.name))) {
      yield chemin
    }
  }
}

/** Les seuils réellement utilisés, normalisés, avec les fichiers qui les portent. */
function seuils(): Map<number, Set<string>> {
  const vus = new Map<number, Set<string>>()
  const noter = (valeur: number, fichier: string) => {
    const ou = vus.get(valeur) ?? new Set<string>()
    ou.add(fichier.replace(RACINE, "").replace(/\\/g, "/"))
    vus.set(valeur, ou)
  }
  for (const f of fichiers(RACINE)) {
    const src = readFileSync(f, "utf8")
    for (const m of src.matchAll(/useIsMobile\((\d+)\)/g)) noter(Number(m[1]), f)
    // Le prélude d'une media query, et rien d'autre : `@media … {`.
    for (const bloc of src.matchAll(/@media([^{]*)\{/g))
      for (const w of bloc[1].matchAll(/(max|min)-width:\s*(\d+)px/g))
        noter(w[1] === "min" ? Number(w[2]) - 1 : Number(w[2]), f)
  }
  return vus
}

// Inventaire gelé le 5 octobre 2026. Cette liste est une DETTE : elle n'a le
// droit que de raccourcir. Chaque lot de la refonte mobile qui migre un écran en
// retire une valeur et met le compte à jour, en baisse.
const HERITAGE = [
  400, 420, 480, 500, 560, 580, 600, 620, 640, 680, 700, 720, 760, 768, 800,
  820, 859, 860, 880, 899, 900, 919, 980, 1000, 1024, 1100, 1500,
] as const

const COMPTE_AU_5_OCTOBRE = 27

describe("les ruptures de largeur ne se multiplient plus", () => {
  const vus = seuils()
  const valeurs = [...vus.keys()].sort((a, b) => a - b)

  it("la garde voit bien quelque chose", () => {
    // Sans cette borne, un changement de chemin rendrait la garde muette : zéro
    // fichier lu, zéro seuil trouvé, zéro échec. C'est exactement comme ça
    // qu'une garde meurt sans bruit.
    expect(valeurs.length).toBeGreaterThan(10)
  })

  it("aucun seuil nouveau n'est apparu depuis le 5 octobre 2026", () => {
    const nouveaux = valeurs.filter(v => !HERITAGE.includes(v as (typeof HERITAGE)[number]))
    expect(
      nouveaux.map(v => `${v}px — ${[...(vus.get(v) ?? [])].join(", ")}`),
      "une nouvelle rupture de largeur : utilisez RUPTURES (sm/md/lg/xl) de lib/ruptures.ts",
    ).toEqual([])
  })

  it("le nombre de seuils ne remonte pas", () => {
    // Le cliquet. S'il baisse, mettez COMPTE_AU_5_OCTOBRE à jour EN BAISSE et
    // retirez la valeur de HERITAGE — ne relevez jamais ce nombre.
    expect(valeurs.length).toBeLessThanOrEqual(COMPTE_AU_5_OCTOBRE)
  })

  it("les quatre ruptures canoniques restent déclarées et cohérentes", () => {
    expect(LARGEURS_CONNUES).toEqual([RUPTURES.sm, RUPTURES.md, RUPTURES.lg, RUPTURES.xl])
  })

  it("l'écart à résorber est connu, et nommé", () => {
    // Ce test ne protège rien : il rend la dette VISIBLE dans la sortie de la
    // suite. Une dette qu'on ne compte pas est une dette qu'on oublie.
    const conformes = valeurs.filter(v => LARGEURS_CONNUES.includes(v))
    const aResorber = valeurs.length - conformes.length
    expect(conformes.length).toBeGreaterThan(0)
    expect(aResorber).toBeLessThanOrEqual(25)
  })
})
