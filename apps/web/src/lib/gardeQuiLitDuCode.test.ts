import { describe, it, expect } from "vitest"
import { readdirSync, statSync, readFileSync } from "node:fs"
import { join, relative, sep } from "node:path"
import { sansCommentaires } from "./codeSeul"

// NOTE : en-tête en commentaires de LIGNE, et non en bloc. Ce texte cite
// l'idiome gourmand, qui contient la séquence fermante d'un bloc. Écrit en
// bloc, il se refermait au milieu d'une phrase et le fichier ne compilait
// plus — le défaut que ce fichier traque, une cinquième fois, pendant qu'on
// l'écrivait.
//
// Une garde qui lit du source lit le CODE, et le code seul.
//
// ── Le défaut que cette garde ferme ──────────────────────────────────────
//
// Trois fois le même jour, une garde de ce dépôt a crié sur un commentaire :
//
//   · `lienQuiJoint` sautait les lignes `//` mais pas l'ouverture d'un `/**` ;
//   · deux gardes neuves lisaient l'explication de `allerChercher.ts` — qui
//     dit POURQUOI `redirect: "follow"` serait dangereux — comme du code.
//
// Chaque fois, même symptôme, même correctif local. Un correctif local sur un
// défaut qui revient trois fois n'est pas un correctif : c'est un symptôme.
//
// Et le défaut est pire qu'il n'en a l'air. Le dépôt portait quatre
// conventions de décommentage concurrentes, dont une — `/\/\/[^\n]*/g` —
// ampute la fin de toute ligne contenant `https://`. Une garde qui lit un
// fichier amputé ne crie pas : elle se TAIT. C'est une protection qui
// disparaît sans un mot, et personne ne la voit partir.
//
// ── Ce que cette garde exige ─────────────────────────────────────────────
//
// Un seul décommenteur, partagé et testé : `lib/codeSeul`. La liste ci-dessous
// est un cliquet : trois dérogations, chacune avec sa raison. Toute nouvelle
// entrée doit être justifiée ici, ou disparaître.
//
// ── La garde se sert de ce qu'elle protège ───────────────────────────────
//
// Elle lit les fichiers À TRAVERS `sansCommentaires`. Ce n'est pas une
// élégance : `codeSeul.ts` CITE les quatre vieilles conventions dans son
// en-tête pour expliquer ce qu'elles cassaient. Une garde naïve le
// dénoncerait — le piège, une quatrième fois, dans le module même qui existe
// pour le fermer.

const RACINES = ["apps/web/src", "apps/web/scripts", "scripts"]
const DEPOT = join(__dirname, "../../../..")

/** Les idiomes de décommentage fait main, tels qu'on les écrit. */
const IDIOMES = [
  String.raw`\/\*[\s\S]*?\*\/`,   // le bloc /* … */
  String.raw`\/\/[^\n]*`,         // la ligne // … , version gourmande
  String.raw`\/\/.*$/gm`,          // la ligne // … , ancrée
  String.raw`\s*\/\/.*$/`,         // la ligne // … , en fin de code
]

/**
 * Les dérogations, et pourquoi chacune est légitime.
 *
 * Elles ne sont pas « à migrer plus tard » : les trois ont une raison qui ne
 * s'en ira pas.
 */
const DEROGATIONS: Record<string, string> = {
  // CSS : `//` n'y est PAS un commentaire. Y appliquer un décommenteur
  // JavaScript effacerait du code valide — l'inverse du but.
  "apps/web/src/app/ciblesPouce.test.ts": "feuille de style : seul /* … */ existe en CSS",
  "apps/web/src/components/ui/champQuiNeZoomePas.test.ts": "feuille de style : seul /* … */ existe en CSS",
  // Script de build lancé par Node avant toute compilation : il ne peut pas
  // importer un module TypeScript. Sa propre version est gardée par
  // `garde-fous-du-build`.
  "apps/web/scripts/check-jsx-imports.mjs": "script de build : pas d'import TypeScript possible",
  // Ce fichier-ci cite les idiomes pour les chercher, et le moteur les cite
  // pour les expliquer — tous deux à travers `sansCommentaires`, donc seuls
  // leurs usages RÉELS comptent.
  "apps/web/src/lib/gardeQuiLitDuCode.test.ts": "la garde elle-même : elle cite les idiomes pour les traquer",
  "apps/web/src/lib/codeSeul.test.ts": "les contre-preuves du moteur : elles gardent les vieilles conventions pour montrer ce qu'elles cassaient",
}

function fichiers(): string[] {
  const out: string[] = []
  const parcourir = (d: string) => {
    // Trié SUR LA MÊME ligne que la lecture : `testsDeterministes` l'exige, et
    // il a raison — l'ordre d'un `readdirSync` dépend du système de fichiers,
    // donc un relevé non trié rend le verdict dépendant de la machine.
    let entrees: string[]
    try { entrees = readdirSync(d).sort() } catch { return }
    for (const e of entrees) {
      if (e === "node_modules" || e === ".next" || e === "dist") continue
      const p = join(d, e)
      if (statSync(p).isDirectory()) { parcourir(p); continue }
      if (/\.(ts|tsx|mjs)$/.test(e)) out.push(p)
    }
  }
  for (const r of RACINES) parcourir(join(DEPOT, r))
  return out
}

/** Les fichiers qui décommentent à la main — commentaires exclus. */
function faitsMain(): string[] {
  const coupables: string[] = []
  for (const f of fichiers()) {
    const src = sansCommentaires(readFileSync(f, "utf8"))
    if (IDIOMES.some(i => src.includes(i))) {
      coupables.push(relative(DEPOT, f).split(sep).join("/"))
    }
  }
  return coupables.sort()
}

describe("un seul décommenteur pour tout le dépôt", () => {
  it("personne ne réinvente le décommentage, sauf les trois cas qui le doivent", () => {
    const attendus = Object.keys(DEROGATIONS).sort()
    expect(
      faitsMain(),
      "une garde décommente à la main : utilisez `sansCommentaires` de `lib/codeSeul`, " +
      "ou justifiez la dérogation dans DEROGATIONS ci-dessus",
    ).toEqual(attendus)
  })

  it("chaque dérogation porte sa raison, et le fichier existe encore", () => {
    // Une dérogation pour un fichier disparu est une ligne morte qui laisse
    // croire qu'on a réfléchi.
    for (const [f, raison] of Object.entries(DEROGATIONS)) {
      expect(raison.length, `${f} : la dérogation n'explique rien`).toBeGreaterThan(20)
      expect(() => statSync(join(DEPOT, f)), `${f} : dérogation pour un fichier disparu`).not.toThrow()
    }
  })

  it("le détecteur n'est pas aveugle — contre-preuve", () => {
    // Sans cela, une faute de frappe dans un idiome rendrait la garde muette
    // pour toujours, et verte à chaque passage.
    const faux = [
      `const x = s.replace(/\\/\\*[\\s\\S]*?\\*\\//g, "")`,
      `const y = s.replace(/\\/\\/[^\\n]*/g, "")`,
      `const z = s.replace(/^\\s*\\/\\/.*$/gm, "")`,
    ]
    for (const ligne of faux) {
      expect(IDIOMES.some(i => ligne.includes(i)), `cet idiome passe inaperçu : ${ligne}`).toBe(true)
    }
  })

  it("…et il ne crie pas sur un commentaire qui CITE un idiome", () => {
    // C'est tout le sujet. La garde lit le code à travers le décommenteur
    // qu'elle protège.
    const commente = `// on n'écrit plus .replace(/\\/\\*[\\s\\S]*?\\*\\//g, "") ici\nconst a = 1`
    const code = sansCommentaires(commente)
    expect(IDIOMES.some(i => code.includes(i)), "la garde crie sur un commentaire").toBe(false)
  })

  it("le parcours voit bien le dépôt — sinon il ne prouve rien", () => {
    const vus = fichiers()
    expect(vus.length, "le parcours ne trouve presque rien : la racine est fausse").toBeGreaterThan(400)
    expect(vus.some(f => f.endsWith("codeSeul.ts"))).toBe(true)
    expect(vus.some(f => f.endsWith("check-jsx-imports.mjs"))).toBe(true)
  })
})
