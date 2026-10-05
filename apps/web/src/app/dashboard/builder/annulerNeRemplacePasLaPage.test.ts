import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { creerHistorique } from "./builderHooks"

// ═══════════════════════════════════════════════════════════════════════════════
// ANNULER A REMPLACÉ LA PAGE (Q01).
//
// Le 29 septembre, sur /dashboard/builder?draft=1 : ouvrir « Bistrot français »
// depuis /creer, renommer le premier bloc, cliquer sur Annuler. Les dix blocs du
// modèle laissaient place à trois blocs génériques et le titre redevenait
// « Ma Page ». Reproduit deux fois, dont une après rechargement.
//
// Le moteur d'historique n'y était pour rien. L'éditeur montait avec un squelette
// de démonstration, l'historique en prenait note comme seul passé, puis le
// brouillon arrivait par `applyDraft` — qui posait blocs, thème et nom avec les
// setters BRUTS, sans jamais prévenir l'historique. La première modification
// empilait donc le document au-dessus du squelette, et la première annulation
// redescendait sur le squelette.
//
// La règle tenue ici : **un document qui entre dans l'éditeur devient le passé de
// l'éditeur.** Annuler juste après avoir ouvert un modèle ne doit rien pouvoir
// retirer d'autre que ce qu'on vient soi-même de taper.
// ═══════════════════════════════════════════════════════════════════════════════

type Doc = { blocks: { id: string; type: string; content: Record<string, unknown> }[]; theme: { primary: string }; name: string }

/** Le squelette posé au montage de l'éditeur : trois blocs, « Ma Page ». */
const SQUELETTE: Doc = {
  blocks: [
    { id: "1", type: "profile", content: { name: "Votre nom" } },
    { id: "2", type: "social_links", content: {} },
    { id: "3", type: "cta_button", content: { label: "Me contacter" } },
  ],
  theme: { primary: "#C9A84C" },
  name: "Ma Page",
}

/** Le modèle choisi par le visiteur : dix blocs, son propre thème, son propre nom. */
const MODELE: Doc = {
  blocks: Array.from({ length: 10 }, (_, i) => ({ id: `bistrot-${i}`, type: "text", content: { titre: `Bloc ${i}` } })),
  theme: { primary: "#8B0000" },
  name: "Bistrot français",
}

/** Le même modèle, après que le visiteur a renommé son premier bloc. */
const MODELE_MODIFIE: Doc = {
  ...MODELE,
  blocks: MODELE.blocks.map((b, i) => (i === 0 ? { ...b, content: { titre: "Notre maison" } } : b)),
}

describe("Q01 — la première annulation ne remplace pas le document", () => {
  it("reproduit le défaut : sans hydratation de l'historique, Annuler ramène le squelette", () => {
    // Exactement l'ancien enchaînement : montage, puis document posé À CÔTÉ de
    // l'historique, puis une modification, puis Annuler.
    const h = creerHistorique<Doc>(SQUELETTE)
    h.push(MODELE_MODIFIE) // la 1re modification est le 1er push : le modèle n'a jamais été vu

    const apres = h.undo()
    expect(apres?.blocks).toHaveLength(3) // le symptôme constaté par l'audit
    expect(apres?.name).toBe("Ma Page")
  })

  it("le document ouvert devient le passé : Annuler ne retire que la modification", () => {
    const h = creerHistorique<Doc>(SQUELETTE)
    h.reset(MODELE) // ce que fait désormais `hydrater` dans l'éditeur
    h.push(MODELE_MODIFIE)

    const apres = h.undo()
    expect(apres?.blocks).toHaveLength(10)
    expect(apres?.name).toBe("Bistrot français")
    expect(apres?.theme.primary).toBe("#8B0000")
    expect(apres?.blocks[0].content.titre).toBe("Bloc 0") // seul le renommage est parti
    expect(apres?.blocks.map(b => b.id)).toEqual(MODELE.blocks.map(b => b.id)) // ordre et identifiants intacts
  })

  it("s'acharner sur Annuler ne descend jamais sous le document ouvert", () => {
    const h = creerHistorique<Doc>(SQUELETTE)
    h.reset(MODELE)
    h.push(MODELE_MODIFIE)

    h.undo()
    expect(h.canUndo()).toBe(false)
    expect(h.undo()).toBeNull()
    expect(h.get().blocks).toHaveLength(10)
  })

  it("Rétablir revient à la modification, et repartir de là n'exhume pas le squelette", () => {
    const h = creerHistorique<Doc>(SQUELETTE)
    h.reset(MODELE)
    h.push(MODELE_MODIFIE)
    h.undo()

    expect(h.redo()?.blocks[0].content.titre).toBe("Notre maison")

    // Nouvelle modification après le rétablissement, puis Annuler : on retombe sur
    // la modification précédente — jamais sur les trois blocs du montage.
    h.push({ ...MODELE_MODIFIE, name: "Le Bistrot" })
    expect(h.undo()?.name).toBe("Bistrot français")
    expect(h.get().blocks).toHaveLength(10)
  })

  it("un rechargement rejoue la même hydratation : le résultat ne change pas", () => {
    // Au rechargement, l'éditeur remonte sur le squelette et rehydrate le brouillon.
    // Le scénario doit tenir à l'identique — c'est le second essai de l'audit.
    for (const tour of [1, 2, 3]) {
      const h = creerHistorique<Doc>(SQUELETTE)
      h.reset(MODELE)
      h.push(MODELE_MODIFIE)
      expect(h.undo()?.blocks, `tour ${tour}`).toHaveLength(10)
    }
  })

  it("une page vide reste vide : l'historique ne garde pas les blocs de démonstration", () => {
    const h = creerHistorique<Doc>(SQUELETTE)
    h.reset({ blocks: [], theme: MODELE.theme, name: "Page neuve" })
    h.push({ blocks: [MODELE.blocks[0]], theme: MODELE.theme, name: "Page neuve" })
    expect(h.undo()?.blocks).toHaveLength(0)
  })

  it("l'historique garde des copies : modifier le document rendu ne réécrit pas le passé", () => {
    const h = creerHistorique<Doc>(SQUELETTE)
    h.reset(MODELE)
    h.push(MODELE_MODIFIE)
    const rendu = h.undo()!
    rendu.blocks.pop()
    rendu.name = "saboté"
    expect(h.get().blocks).toHaveLength(10)
    expect(h.get().name).toBe("Bistrot français")
  })
})

// ── Une seule porte d'entrée pour les documents ────────────────────────────
// Le défaut n'était pas dans le moteur mais dans un appelant qui l'avait oublié.
// Une deuxième implémentation le réintroduirait en silence : on vérifie donc qu'il
// n'y a qu'un seul geste d'hydratation, et que tous les chemins y passent.
const builder = readFileSync(fileURLToPath(new URL("./BuilderV4.tsx", import.meta.url)), "utf8")

describe("Q01 — l'éditeur n'a qu'un geste pour poser un document", () => {
  it("`hydrater` pose blocs, thème, nom ET réinitialise l'historique", () => {
    const corps = builder.split("const hydrater = useCallback(")[1]
    expect(corps, "`hydrater` a disparu de BuilderV4").toBeTruthy()
    const geste = corps.slice(0, corps.indexOf("}, ["))
    for (const attendu of ["setBlocksRaw(s.blocks)", "setTheme(s.theme)", "setPageName(s.name)", "undoRedo.reset(s)"]) {
      expect(geste, `\`hydrater\` ne fait plus : ${attendu}`).toContain(attendu)
    }
  })

  it("`undoRedo.reset` n'est appelé que depuis `hydrater`", () => {
    const appels = builder.match(/undoRedo\.reset\(/g) ?? []
    expect(appels.length, "un second chemin réinitialise l'historique de son côté").toBe(1)
  })

  it("les trois entrées de document passent par `hydrater`", () => {
    // Brouillon d'un visiteur (?draft=1) — le chemin de l'audit.
    const applyDraft = builder.slice(builder.indexOf("function applyDraft("))
    expect(applyDraft.slice(0, applyDraft.indexOf("\n    }")), "applyDraft n'hydrate plus l'historique").toContain("hydrater({")
    // Page relue en base, et brouillon repris après inscription.
    expect(builder).toContain("hydrater({ blocks: loaded,")
    expect(builder).toContain("name: claimed.pageName,")
  })
})
