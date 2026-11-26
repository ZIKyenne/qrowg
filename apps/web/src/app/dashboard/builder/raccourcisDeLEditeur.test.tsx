// @vitest-environment jsdom
//
// Le clavier de l'éditeur, joué — point 7 de la vague 4, lot 2 (v388).
//
// La table (`raccourcisClavier.ts`) était testée en règle pure ; son câble, lui,
// vivait dans un effet de BuilderV4 sans aucun test : qui dit « on est dans un
// champ », qui confisque Ctrl+P au navigateur, qui lit la sélection du moment.
// On monte ici le vrai crochet, on envoie de vraies touches depuis de vrais
// éléments, et on regarde ce que l'éditeur reçoit.

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { act, useState } from "react"
import { createRoot, type Root } from "react-dom/client"
import { useRaccourcisDeLEditeur } from "./useRaccourcisDeLEditeur"
import { estEnSaisie, blocVoisin, type DecisionClavier } from "./raccourcisClavier"
import { deplacerLeBloc } from "./builderHooks"
import { useFermetureEchap } from "@/components/ui/useDialogue"

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let hote: HTMLDivElement
let racine: Root
beforeEach(() => { hote = document.createElement("div"); document.body.appendChild(hote); racine = createRoot(hote) })
afterEach(() => { act(() => racine.unmount()); hote.remove() })

const par = (id: string) => document.getElementById(id) as HTMLElement
/** Une touche, partie de `depuis`, qui remonte jusqu'à la page — comme au clavier. */
function touche(key: string, opts: KeyboardEventInit = {}, depuis: Element = document.body): KeyboardEvent {
  const e = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...opts })
  act(() => { depuis.dispatchEvent(e) })
  return e
}

/** Un écran d'éditeur réduit à l'essentiel : un champ, une zone éditable en ligne, un bloc. */
function Editeur({ recu, selection = true, multiple = false, coucheOuverte = false }: {
  recu: (d: DecisionClavier) => void; selection?: boolean; multiple?: boolean; coucheOuverte?: boolean
}) {
  const [couche, setCouche] = useState(coucheOuverte)
  useFermetureEchap(couche, () => setCouche(false))
  useRaccourcisDeLEditeur(() => ({ blocSelectionne: selection, selectionMultiple: multiple }), recu)
  return <>
    <input id="champ" />
    <textarea id="zone" />
    <select id="liste"><option>a</option></select>
    <div id="enLigne" contentEditable suppressContentEditableWarning><span id="mot">Bonjour</span></div>
    <div id="bloc" tabIndex={0}>Un bloc</div>
    {couche && <div id="couche">Menu</div>}
  </>
}
const actions = (f: ReturnType<typeof vi.fn>) => f.mock.calls.map(c => (c[0] as DecisionClavier).action)

describe("ce que l'éditeur reçoit quand on tape", () => {
  it("hors champ, les raccourcis arrivent, avec leur direction", () => {
    const recu = vi.fn()
    act(() => racine.render(<Editeur recu={recu} />))
    touche("z", { ctrlKey: true }); touche("d", { ctrlKey: true }); touche("ArrowDown", { altKey: true }, par("bloc"))
    expect(actions(recu)).toEqual(["annuler", "dupliquer", "deplacerBloc"])
    expect(recu.mock.calls[2][0].direction).toBe(1)
  })

  it("Cmd fait ce que fait Ctrl (Mac)", () => {
    const recu = vi.fn()
    act(() => racine.render(<Editeur recu={recu} />))
    touche("z", { metaKey: true })
    expect(actions(recu)).toEqual(["annuler"])
  })

  it("dans un champ, une zone de texte, une liste ou l'édition en ligne : Suppr efface une lettre, pas le bloc", () => {
    const recu = vi.fn()
    act(() => racine.render(<Editeur recu={recu} />))
    for (const id of ["champ", "zone", "liste", "enLigne", "mot"]) {
      const e = touche("Delete", {}, par(id))
      expect(e.defaultPrevented, `${id} : la touche reste au champ`).toBe(false)
      touche("z", { ctrlKey: true }, par(id))
      touche("ArrowUp", {}, par(id))
    }
    expect(actions(recu), "rien n'est parti du champ vers l'éditeur").toEqual([])
    // …sauf la palette, qui est la porte de sortie.
    touche("k", { ctrlKey: true }, par("mot"))
    expect(actions(recu)).toEqual(["palette"])
  })

  it("une touche confisquée ne fait pas son geste navigateur ; une touche laissée passe", () => {
    const recu = vi.fn()
    act(() => racine.render(<Editeur recu={recu} />))
    expect(touche("p", { ctrlKey: true }).defaultPrevented, "Ctrl+P n'ouvre pas l'impression").toBe(true)
    expect(touche("d", { ctrlKey: true }).defaultPrevented, "Ctrl+D ne met pas la page en favori").toBe(true)
    expect(touche("Escape").defaultPrevented, "Échap désélectionne sans rien confisquer").toBe(false)
    expect(touche("x").defaultPrevented, "une lettre sans raccourci").toBe(false)
  })

  it("sans bloc sélectionné, les flèches font défiler la page", () => {
    const recu = vi.fn()
    act(() => racine.render(<Editeur recu={recu} selection={false} />))
    const e = touche("ArrowDown")
    expect(e.defaultPrevented).toBe(false)
    expect(recu).not.toHaveBeenCalled()
  })

  it("l'écran du moment est lu au moment de la touche, pas au premier rendu", () => {
    // L'écouteur n'est posé qu'une fois ; s'il gardait l'état du premier rendu,
    // Suppr ignorerait la sélection multiple faite depuis.
    const recu = vi.fn()
    act(() => racine.render(<Editeur recu={recu} />))
    touche("Delete")
    act(() => racine.render(<Editeur recu={recu} multiple />))
    touche("Delete")
    expect(actions(recu)).toEqual(["supprimerBloc", "supprimerSelection"])
    // …et c'est la dernière fonction de l'éditeur qui reçoit, pas la première.
    const neuve = vi.fn()
    act(() => racine.render(<Editeur recu={neuve} multiple />))
    touche("Delete")
    expect(actions(neuve)).toEqual(["supprimerSelection"])
    expect(recu).toHaveBeenCalledTimes(2)
  })

  it("une couche ouverte prend Échap : elle se ferme, et la sélection reste", () => {
    const recu = vi.fn()
    act(() => racine.render(<Editeur recu={recu} coucheOuverte />))
    touche("Escape", {}, par("bloc"))
    expect(par("couche"), "la couche s'est fermée").toBeNull()
    expect(actions(recu), "l'éditeur n'a pas vu la touche").toEqual([])
    touche("Escape", {}, par("bloc"))
    expect(actions(recu), "couche fermée, Échap revient à l'éditeur").toEqual(["deselectionner"])
  })

  it("l'éditeur quitté, plus rien n'écoute", () => {
    const recu = vi.fn()
    act(() => racine.render(<Editeur recu={recu} />))
    act(() => racine.unmount())
    touche("z", { ctrlKey: true })
    expect(recu).not.toHaveBeenCalled()
    racine = createRoot(hote)
  })
})

describe("les deux gestes de flèche, en pur", () => {
  const B = [{ id: "a" }, { id: "b", locked: true }, { id: "c" }, { id: "d" }]

  it("Alt+flèche : un cran, jamais au-delà des bords, jamais un bloc verrouillé", () => {
    expect(deplacerLeBloc(B, "c", 1).map(b => b.id)).toEqual(["a", "b", "d", "c"])
    expect(deplacerLeBloc(B, "a", -1), "en haut, rien ne bouge — le même tableau").toBe(B)
    expect(deplacerLeBloc(B, "d", 1)).toBe(B)
    expect(deplacerLeBloc(B, "b", 1), "verrouillé").toBe(B)
    expect(deplacerLeBloc(B, "inconnu", 1)).toBe(B)
    expect(B.map(b => b.id), "l'original n'est pas touché").toEqual(["a", "b", "c", "d"])
  })

  it("↑ / ↓ : le bloc d'à côté, rien aux bords", () => {
    expect(blocVoisin(B, "a", 1)).toBe("b")
    expect(blocVoisin(B, "c", -1)).toBe("b")
    expect(blocVoisin(B, "a", -1)).toBeNull()
    expect(blocVoisin(B, "d", 1)).toBeNull()
    expect(blocVoisin(B, null, 1)).toBeNull()
  })

  it("estEnSaisie ne voit un champ que là où il y en a un", () => {
    act(() => racine.render(<Editeur recu={() => {}} />))
    expect(["champ", "zone", "liste", "enLigne", "mot"].map(id => estEnSaisie(par(id)))).toEqual([true, true, true, true, true])
    expect(estEnSaisie(par("bloc"))).toBe(false)
    expect(estEnSaisie(document.body)).toBe(false)
    expect(estEnSaisie(window)).toBe(false)
    expect(estEnSaisie(null)).toBe(false)
  })
})
