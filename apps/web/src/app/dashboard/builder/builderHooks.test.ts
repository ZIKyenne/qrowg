import { describe, it, expect } from "vitest"
import { shouldCoalesce, COALESCE_MS, reorderArray, cloneBlocks, creerHistorique } from "./builderHooks"

// Clonage de blocs (copier/coller, duplication) — Builder Phase 2 §2.5.
describe("cloneBlocks", () => {
  const mkGen = () => { let n = 0; return () => `id-${++n}` }

  it("attribue des identifiants neufs et préserve le contenu + les autres champs", () => {
    const src = [
      { id: "a", type: "cta", content: { label: "Salut" }, visible: true, locked: true },
      { id: "b", type: "bio", content: { text: "x" }, visible: false },
    ]
    const out = cloneBlocks(src, mkGen())
    expect(out.map(b => b.id)).toEqual(["id-1", "id-2"])
    expect(out[0].type).toBe("cta")
    expect(out[0].content).toEqual({ label: "Salut" })
    expect(out[0].visible).toBe(true)
    expect(out[0].locked).toBe(true)
    expect(out[1].visible).toBe(false)
  })

  it("copie le contenu (nouvelle référence, pas d'aliasing) et ne mute pas la source", () => {
    const src = [{ id: "a", type: "cta", content: { label: "x" }, visible: true }]
    const out = cloneBlocks(src, mkGen())
    out[0].content.label = "modifié"
    expect(src[0].content.label).toBe("x")   // source intacte
    expect(src[0].id).toBe("a")
  })

  it("tableau vide -> tableau vide", () => {
    expect(cloneBlocks([], mkGen())).toEqual([])
  })
})

// Réordonnancement par glisser-déposer (Builder, Phase 2 §2.14).
describe("reorderArray", () => {
  const A = ["A", "B", "C", "D"]

  it("déplace un élément vers le bas (insertBefore après la cible)", () => {
    expect(reorderArray(A, 0, 2)).toEqual(["B", "A", "C", "D"]) // A avant C
    expect(reorderArray(A, 1, 4)).toEqual(["A", "C", "D", "B"]) // B à la fin
  })

  it("déplace un élément vers le haut", () => {
    expect(reorderArray(A, 3, 0)).toEqual(["D", "A", "B", "C"]) // D au début
    expect(reorderArray(A, 2, 1)).toEqual(["A", "C", "B", "D"]) // C avant B
  })

  it("déposer sur soi-même ne change rien", () => {
    expect(reorderArray(A, 1, 1)).toEqual(A)
    expect(reorderArray(A, 1, 2)).toEqual(A)
  })

  it("borne la destination et ignore un index source hors limites", () => {
    expect(reorderArray(A, 0, 99)).toEqual(["B", "C", "D", "A"])
    expect(reorderArray(A, -1, 0)).toEqual(A)
    expect(reorderArray(A, 9, 0)).toEqual(A)
  })

  it("ne mute pas le tableau d'origine", () => {
    const orig = ["A", "B", "C"]
    const copy = orig.slice()
    reorderArray(orig, 0, 2)
    expect(orig).toEqual(copy)
  })
})

// Décision de coalescing de l'historique undo/redo (Builder). Regroupe les frappes
// consécutives sur un même champ en une seule entrée ; garde les opérations
// structurelles distinctes. Voir docs/BUILDER-REBUILD-PLAN.md §2.3.
describe("shouldCoalesce", () => {
  const KEY = "field:b1:title"

  it("fusionne deux push rapides portant la MÊME clé, au sommet", () => {
    expect(shouldCoalesce(KEY, 1000, KEY, 1100, true)).toBe(true)
  })

  it("ne fusionne PAS sans clé (opération structurelle : ajout/suppression/déplacement)", () => {
    expect(shouldCoalesce(KEY, 1000, undefined, 1100, true)).toBe(false)
    expect(shouldCoalesce(KEY, 1000, null, 1100, true)).toBe(false)
  })

  it("ne fusionne PAS si la clé change (champ ou bloc différent)", () => {
    expect(shouldCoalesce(KEY, 1000, "field:b1:subtitle", 1100, true)).toBe(false)
    expect(shouldCoalesce(KEY, 1000, "field:b2:title", 1100, true)).toBe(false)
  })

  it("ne fusionne PAS après la fenêtre temporelle (nouvelle rafale)", () => {
    expect(shouldCoalesce(KEY, 1000, KEY, 1000 + COALESCE_MS, true)).toBe(false)     // borne exclue
    expect(shouldCoalesce(KEY, 1000, KEY, 1000 + COALESCE_MS + 1, true)).toBe(false)
    expect(shouldCoalesce(KEY, 1000, KEY, 1000 + COALESCE_MS - 1, true)).toBe(true)  // juste dedans
  })

  it("ne fusionne PAS hors du sommet (après un undo)", () => {
    expect(shouldCoalesce(KEY, 1000, KEY, 1100, false)).toBe(false)
  })

  it("ne fusionne PAS quand il n'y a pas de clé précédente (premier push d'une rafale)", () => {
    expect(shouldCoalesce(null, 0, KEY, 1000, true)).toBe(false)
  })

  it("respecte une fenêtre personnalisée", () => {
    expect(shouldCoalesce(KEY, 1000, KEY, 1200, true, 100)).toBe(false)
    expect(shouldCoalesce(KEY, 1000, KEY, 1050, true, 100)).toBe(true)
  })
})

// v388 — React a le droit d'appeler deux fois une fonction de mise à jour, et
// l'éditeur empile depuis l'une d'elles : un déplacement laissait deux entrées
// identiques, et le premier Ctrl+Z ne faisait rien (mesuré au navigateur).
describe("un état inchangé n'entre pas dans l'historique", () => {
  const A = { blocs: ["a", "b"] }, B = { blocs: ["b", "a"] }

  it("le même état poussé deux fois ne fait qu'une entrée : un seul Annuler suffit", () => {
    const h = creerHistorique(A)
    h.push(B); h.push({ blocs: ["b", "a"] }) // la seconde, une copie conforme
    expect(h.size()).toBe(2)
    expect(h.undo()).toEqual(A)
    expect(h.canUndo()).toBe(false)
  })

  it("pousser l'état de l'écran ne crée rien", () => {
    const h = creerHistorique(A)
    h.push({ blocs: ["a", "b"] })
    expect(h.canUndo()).toBe(false)
  })

  it("après un Annuler, un état inchangé ne coupe pas le futur", () => {
    const h = creerHistorique(A)
    h.push(B); h.undo()
    h.push({ blocs: ["a", "b"] })
    expect(h.canRedo(), "Rétablir reste possible").toBe(true)
    expect(h.redo()).toEqual(B)
  })

  it("un vrai changement entre toujours, même identique à un état plus ancien", () => {
    const h = creerHistorique(A)
    h.push(B); h.push(A)
    expect(h.size()).toBe(3)
    expect(h.undo()).toEqual(B)
  })
})
