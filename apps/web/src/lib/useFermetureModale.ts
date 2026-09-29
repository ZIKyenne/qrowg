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
import { useFermetureEchap, declencheurPrecedent, pendantUneCouche } from "@/components/ui/useDialogue"

export function useFermetureModale(ouvert: boolean, onFermer: () => void) {
  const origine = useRef<HTMLElement | null>(null)

  useFermetureEchap(ouvert, onFermer)

  useEffect(() => {
    if (!ouvert) return
    // Il lisait `document.activeElement` ICI, c'est-à-dire trop tard et trop
    // fragilement — la deuxième copie du même défaut, réparé dans `useDialogue`
    // le 29 septembre :
    //
    //  • `autoFocus` s'applique pendant la validation du rendu, donc AVANT les
    //    effets : la couche gardait alors son propre champ comme « origine » ;
    //  • un rendu concurrent peut être abandonné et recommencé, et la référence
    //    repart neuve — relevé au tableau de bord : cinq relèvements pour une
    //    ouverture, dont quatre sur `<body>`.
    //
    // Le déclencheur se lit donc au même endroit que pour les fenêtres : un
    // suivi du focus au niveau du document, en pause tant qu'une couche est
    // ouverte. Vingt-quatre couches du produit passent par ici.
    origine.current = declencheurPrecedent()
    const relacherLaCouche = pendantUneCouche()

    const defilement = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      relacherLaCouche()
      document.body.style.overflow = defilement
      const o = origine.current
      if (o && o.isConnected) o.focus()
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
