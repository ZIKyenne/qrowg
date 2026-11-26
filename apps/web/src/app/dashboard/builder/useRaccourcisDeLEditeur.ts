"use client"

// useRaccourcisDeLEditeur — le branchement du clavier de l'éditeur.
//
// La DÉCISION vit dans `raccourcisClavier.ts` (règle pure, testée). Ce crochet
// en est le câble : il écoute la page, dit à la règle si la touche part d'un
// champ de saisie, confisque la touche au navigateur quand la règle le demande
// (Ctrl+P n'imprime pas, Ctrl+D ne met pas en favori), et remet la décision à
// l'éditeur. Il vivait dans un effet de BuilderV4, sans aucun test : c'est là
// que se jouait « Suppr dans un champ n'efface pas le bloc » (v388).
//
// `lireEtat` et `executer` sont gardés dans des références : l'écouteur n'est
// posé qu'une fois, et lit toujours la dernière version — sans quoi il
// travaillerait sur la sélection du premier rendu.

import { useEffect, useRef } from "react"
import { actionClavier, estEnSaisie, type DecisionClavier } from "./raccourcisClavier"

export function useRaccourcisDeLEditeur(
  lireEtat: () => { blocSelectionne: boolean; selectionMultiple: boolean },
  executer: (d: DecisionClavier) => void,
): void {
  const etatRef = useRef(lireEtat)
  const executerRef = useRef(executer)
  etatRef.current = lireEtat
  executerRef.current = executer

  useEffect(() => {
    const surTouche = (e: KeyboardEvent) => {
      const d = actionClavier(
        { key: e.key, ctrl: e.ctrlKey || e.metaKey, shift: e.shiftKey, alt: e.altKey },
        { ...etatRef.current(), saisieEnCours: estEnSaisie(e.target) },
      )
      if (!d) return
      if (d.bloquer) e.preventDefault()
      executerRef.current(d)
    }
    window.addEventListener("keydown", surTouche)
    return () => window.removeEventListener("keydown", surTouche)
  }, [])
}
