import { describe, it, expect } from "vitest"
import { readdirSync, readFileSync } from "node:fs"
import { join, sep, dirname } from "node:path"
import { fileURLToPath } from "node:url"

// ─────────────────────────────────────────────────────────────────────────────
// AUCUN FICHIER DE PLUS DE 800 LIGNES — ET CEUX QUI LES DÉPASSENT NE GROSSISSENT PLUS
// (vague 4, point 6, lot 1 — 25 nov.)
//
// BuilderV4 avait été décomposé de 6 819 à 2 397 lignes ; sans garde, il est
// remonté à 3 004 (+25 %). Un découpage qui n'est pas gardé se défait.
//
// La règle : un fichier source dépasse 800 lignes seulement s'il est inscrit
// ci-dessous, avec son plafond, et il ne le dépasse jamais. Le plafond ne
// MONTE pas : il descend quand le fichier maigrit (le test l'exige au-delà de
// 50 lignes d'écart), et l'entrée disparaît quand le fichier repasse sous 800.
//
// Les tests (`*.test.ts(x)`) et les types générés de la base n'entrent pas
// dans le compte : leur longueur ne se lit pas comme une dette de découpage.
// ─────────────────────────────────────────────────────────────────────────────

const LIMITE = 800
const MARGE = 50

/** Plafonds relevés le 25 nov. — ne jamais en relever un. */
const PLAFONDS: Record<string, number> = {
  "app/dashboard/builder/blockDefs.ts": 3334,
  "app/dashboard/builder/BuilderV4.tsx": 2789,
  "app/dashboard/print-studio/PrintStudioClient.tsx": 2944,
  "app/dashboard/profile/page.tsx": 2229,
  "app/dashboard/builder/builderPanels.tsx": 2203,
  "app/dashboard/builder/editorPresets.ts": 2017,
  "app/dashboard/builder/types.ts": 1605,
  "app/qr-code/verticals.ts": 1007,
  "app/dashboard/qr-link/page.tsx": 995,
  "app/dashboard/templates/page.tsx": 950,
  "app/dashboard/qr-codes/QRStudioZero.tsx": 942,
  "app/dashboard/builder/templatesStudio.ts": 894,
  "app/homeSectionsRetirees.tsx": 887,
  "app/dashboard/builder/templateStructures.extra.ts": 861,
}

const SRC = join(dirname(fileURLToPath(import.meta.url)), "..")

/** Nombre de lignes, CRLF ou LF, sans compter la ligne vide finale. */
export function lignes(texte: string): number {
  if (texte === "") return 0
  return texte.split("\n").length - (texte.endsWith("\n") ? 1 : 0)
}

function sources(): { rel: string; n: number }[] {
  return readdirSync(SRC, { recursive: true }).map(p => String(p).split(sep).join("/")).sort()
    .filter(r => /\.(ts|tsx)$/.test(r) && !/\.test\.(ts|tsx)$/.test(r) && !r.endsWith("database.generated.ts"))
    .map(rel => ({ rel, n: lignes(readFileSync(join(SRC, rel), "utf8")) }))
}

describe("taille des fichiers source (cliquet)", () => {
  const tous = sources()

  it("la garde lit bien les sources", () => {
    expect(tous.length).toBeGreaterThan(300)
    expect(tous.some(f => f.rel === "app/dashboard/builder/BuilderV4.tsx")).toBe(true)
  })

  it("aucun nouveau fichier au-delà de 800 lignes", () => {
    const nouveaux = tous.filter(f => f.n > LIMITE && !(f.rel in PLAFONDS)).map(f => `${f.rel} : ${f.n} lignes`)
    expect(nouveaux, "découper le fichier — ne pas l'inscrire dans PLAFONDS").toEqual([])
  })

  it("un fichier inscrit ne dépasse jamais son plafond", () => {
    const grossis = tous.filter(f => f.rel in PLAFONDS && f.n > PLAFONDS[f.rel])
      .map(f => `${f.rel} : ${f.n} lignes pour un plafond de ${PLAFONDS[f.rel]}`)
    expect(grossis, "extraire ce qui a été ajouté — le plafond ne monte pas").toEqual([])
  })

  it("un fichier qui maigrit fait descendre son plafond ; sous 800, il sort de la liste", () => {
    const n = new Map(tous.map(f => [f.rel, f.n]))
    const aAbaisser = Object.entries(PLAFONDS).flatMap(([rel, plafond]) => {
      const actuel = n.get(rel)
      if (actuel === undefined) return [`${rel} : n'existe plus — retirer l'entrée`]
      if (actuel <= LIMITE) return [`${rel} : ${actuel} lignes — sous ${LIMITE}, retirer l'entrée`]
      if (plafond - actuel > MARGE) return [`${rel} : ${actuel} lignes — abaisser le plafond (${plafond})`]
      return []
    })
    expect(aAbaisser).toEqual([])
  })

  it("le compte des lignes est juste, CRLF compris", () => {
    expect(lignes("")).toBe(0)
    expect(lignes("a")).toBe(1)
    expect(lignes("a\nb\n")).toBe(2)
    expect(lignes("a\r\nb\r\nc")).toBe(3)
  })
})
