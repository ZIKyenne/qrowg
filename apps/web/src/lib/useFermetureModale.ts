"use client"

// useFermetureModale.ts — Ce qu'une fenêtre superposée doit faire, et que les
// trois de la page « Créer un QR » ne faisaient pas : se fermer avec Échap, geler
// le défilement de la page derrière, et rendre le focus à l'élément d'origine.
//
// Sans ça, on ouvre une fiche, on appuie sur Échap — rien ; on fait défiler, c'est
// la page du dessous qui bouge ; on ferme, et le focus est reparti au début du
// document. Le seul moyen de sortir au clavier était de tabuler jusqu'à la croix.
//
// **Il en tenait sa propre copie.** `components/ui/useDialogue` disait déjà ce
// qu'Échap fait, et ce fichier le réécrivait — même écouteur, même
// `stopPropagation`, même phase de capture. Deux endroits pour décider ce que
// « se fermer » veut dire, donc deux endroits où diverger : c'est le mot à mot
// de l'avertissement écrit dans `Dialogue.tsx` au lot v122, et c'était déjà
// arrivé ailleurs. Il délègue (lot v139) et ne garde que ce qu'il ajoute — le
// gel du défilement et la restitution du focus.

import { useEffect, useRef } from "react"
import { useFermetureEchap } from "@/components/ui/useDialogue"

export function useFermetureModale(ouvert: boolean, onFermer: () => void) {
  const origine = useRef<HTMLElement | null>(null)

  useFermetureEchap(ouvert, onFermer)

  useEffect(() => {
    if (!ouvert) return
    origine.current = (document.activeElement as HTMLElement) || null

    const defilement = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      document.body.style.overflow = defilement
      origine.current?.focus?.()
    }
    // `ouvert` seul : rendre le focus est un geste de SORTIE. Le relancer parce
    // que `onFermer` a changé d'identité — ce qui arrive à chaque rendu quand
    // l'appelant écrit sa fermeture en ligne — renverrait le curseur au bouton
    // d'origine pendant qu'on est encore dans la fenêtre.
  }, [ouvert])
}

/**
 * Rend une carte cliquable utilisable au clavier, sans en faire un <button>
 * (impossible ici : ces cartes contiennent déjà des boutons imbriqués).
 */
export function carteCliquable(onActiver: () => void) {
  return {
    role: "button" as const,
    tabIndex: 0,
    onClick: onActiver,
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onActiver() }
    },
  }
}
