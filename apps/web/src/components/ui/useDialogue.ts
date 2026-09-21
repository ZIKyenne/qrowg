"use client"

// useDialogue — ce qui fait qu'une fenêtre est une VRAIE fenêtre modale :
// rôle annoncé, Échap qui ferme, tabulation qui tourne en rond dedans, focus
// rendu au bouton qui l'a ouverte, page derrière qui ne défile plus.
//
// La primitive Modal portait déjà tout cela ; quatre fenêtres écrites à la main
// (aperçu d'un modèle, nommage d'une page, « Publier », feuille « ⋯ » de
// l'éditeur) n'en avaient rien. Plutôt que de les reconstruire — et de risquer
// leur mise en page — elles adoptent le même comportement en trois lignes.

import { useEffect, useRef, type RefObject } from "react"

/**
 * Échap ferme — la moitié du geste qui vaut pour TOUT ce qui se ferme en
 * cliquant à côté, y compris ce qui n'est pas une fenêtre : un menu « ⋯ », une
 * feuille qui monte du bas, un aperçu plein écran.
 *
 * Elle est seule, et c'est voulu : un menu n'est pas une fenêtre. Lui poser
 * `role="dialog" aria-modal` mentirait au lecteur d'écran, et lui piéger le
 * focus empêcherait d'en sortir par la tabulation, ce qu'un menu doit permettre.
 * Ce qui EST une fenêtre prend `useDialogue`, qui appelle ceci et ajoute le
 * reste.
 *
 * `stopPropagation`, en phase de CAPTURE : la touche est prise avant d'atteindre
 * ce qu'elle aurait fait dessous — annuler une saisie en ligne, désélectionner
 * un bloc de l'éditeur. Fermer une couche ne fait qu'une chose à la fois. Ce
 * n'est pas `stopImmediatePropagation` : deux couches réellement empilées
 * doivent composer leur ordre en un seul appel, comme l'aperçu plein écran et
 * son calibrage dans l'atelier d'impression.
 *
 * `fermer` est gardé dans une référence : une couche ne se réinstalle pas parce
 * que l'appelant a écrit sa fermeture en ligne. Sans cela, `useFermetureModale`
 * — qui repose là-dessus et rend le focus en se retirant — le rendait à CHAQUE
 * rendu de l'écran, et le curseur repartait du bouton d'origine pendant qu'on
 * tapait dans la fenêtre.
 */
export function useFermetureEchap(ouvert: boolean, fermer: () => void): void {
  const fermerRef = useRef(fermer)
  fermerRef.current = fermer

  useEffect(() => {
    if (!ouvert) return
    const surTouche = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return
      e.stopPropagation()
      fermerRef.current()
    }
    document.addEventListener("keydown", surTouche, true)
    return () => document.removeEventListener("keydown", surTouche, true)
  }, [ouvert])
}

const FOCUSABLE =
  'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])'

/** Un champ de saisie : s'il y en a un, c'est là qu'on veut être en entrant. */
const CHAMP = "input:not([type=hidden]),textarea,select"

export type PropsDialogue = {
  role: "dialog"
  "aria-modal": true
  "aria-label"?: string
  "aria-labelledby"?: string
  "aria-describedby"?: string
  tabIndex: -1
}

/**
 * @param ouvert  la fenêtre est-elle affichée
 * @param fermer  ce qu'il faut appeler pour la fermer (Échap)
 * @param nom     nom accessible, ou `labelledBy` si un titre existe déjà
 *                (`describedBy` pour le paragraphe d'explication)
 */
export function useDialogue(
  ouvert: boolean,
  fermer: () => void,
  nom?: { label?: string; labelledBy?: string; describedBy?: string },
): { ref: RefObject<HTMLDivElement | null>; props: PropsDialogue } {
  const ref = useRef<HTMLDivElement>(null)
  const focusPrecedent = useRef<HTMLElement | null>(null)

  // Échap vit au-dessus : une fenêtre est d'abord une couche qui se ferme.
  useFermetureEchap(ouvert, fermer)

  useEffect(() => {
    if (!ouvert) return
    focusPrecedent.current = document.activeElement as HTMLElement | null
    const boite = ref.current
    // Un élément masqué reste dans le DOM et répond au sélecteur : le faire
    // focuser envoie le curseur nulle part, et la boucle de tabulation se
    // referme sur du vide (repris de `Dialogue`, lot v122).
    const focusables = () =>
      Array.from(boite?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])
        .filter(el => el.offsetParent !== null || el === document.activeElement)
    // Le premier champ de saisie s'il y en a un — c'est là qu'on veut être en
    // entrant dans une fenêtre qui demande quelque chose — sinon le premier
    // élément atteignable, sinon le cadre lui-même.
    ;(boite?.querySelector<HTMLElement>(CHAMP) ?? focusables()[0] ?? boite)?.focus()

    const surTouche = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return
      const f = focusables()
      if (f.length === 0) { e.preventDefault(); return }
      const premier = f[0], dernier = f[f.length - 1]
      if (e.shiftKey && document.activeElement === premier) { e.preventDefault(); dernier.focus() }
      else if (!e.shiftKey && document.activeElement === dernier) { e.preventDefault(); premier.focus() }
    }
    document.addEventListener("keydown", surTouche, true)
    const debordementPrecedent = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", surTouche, true)
      document.body.style.overflow = debordementPrecedent
      focusPrecedent.current?.focus?.()
    }
    // `ouvert` seul : cet effet pose le focus et gèle la page. Le relancer
    // parce que `fermer` a changé d'identité renverrait le curseur au bouton
    // d'origine à chaque rendu (lot v139).
  }, [ouvert])

  return {
    ref,
    props: {
      role: "dialog",
      "aria-modal": true,
      ...(nom?.labelledBy ? { "aria-labelledby": nom.labelledBy } : nom?.label ? { "aria-label": nom.label } : {}),
      ...(nom?.describedBy ? { "aria-describedby": nom.describedBy } : {}),
      tabIndex: -1,
    },
  }
}
