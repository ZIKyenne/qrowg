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

/**
 * Où poser le focus en entrant, quand l'appelant le sait mieux que la règle
 * générale. À mettre sur un élément focusable de la fenêtre — ou sur le cadre
 * lui-même, qui porte déjà `tabIndex={-1}`.
 *
 * Une fenêtre qui MONTRE une page (l'aperçu d'un modèle) n'a pas de « premier
 * contrôle » qui vaille : son premier élément atteignable est un lien de la
 * maquette, tout en bas. Le focus y allait, et le navigateur faisait défiler la
 * fenêtre jusqu'à lui — l'aperçu s'ouvrait en bas.
 */
const FOCUS_INITIAL = "[data-focus-initial]"

/**
 * Le dernier élément focusé EN DEHORS d'une fenêtre — autrement dit, le bouton
 * qui va en ouvrir une. Suivi au niveau du document, une fois pour toutes.
 *
 * Deux façons de se tromper, toutes deux mesurées au navigateur le 29 septembre.
 *
 * 1. Le relever dans l'EFFET est trop tard. « Créer une page depuis ce modèle »
 *    a un champ `autoFocus`, et React applique `autoFocus` avant les effets :
 *    l'effet trouvait donc le champ de la fenêtre, le gardait comme « focus
 *    précédent », et le rendait en se retirant à un élément qui venait d'être
 *    détruit. Le focus retombait sur `<body>`, tout en haut de la page.
 *
 * 2. Le relever pendant le RENDU est trop fragile. Un rendu peut être commencé
 *    puis abandonné — c'est le rendu concurrent — et chaque tentative repart
 *    avec des références neuves. Relevé du tableau de bord : cinq relèvements
 *    pour une seule ouverture, dont quatre trouvaient déjà `<body>`. Ce qui est
 *    conservé n'est alors pas ce qu'on croit.
 *
 * Un écouteur de document, lui, voit passer le focus au moment où il bouge, et
 * ne dépend d'aucun cycle de rendu. On ignore ce qui est posé DANS une fenêtre :
 * c'est précisément ce qu'il ne faut pas retenir.
 */
let dernierDeclencheur: HTMLElement | null = null
if (typeof document !== "undefined") {
  document.addEventListener("focusin", e => {
    const el = e.target as HTMLElement | null
    if (!el || typeof el.closest !== "function") return
    if (el.closest('[role="dialog"]')) return
    dernierDeclencheur = el
  }, true)
}

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
    // Voir `dernierDeclencheur` : ni l'effet ni le rendu ne savent dire seuls
    // qui avait le focus avant la fenêtre.
    focusPrecedent.current = dernierDeclencheur
    const boite = ref.current
    // Un élément masqué reste dans le DOM et répond au sélecteur : le faire
    // focuser envoie le curseur nulle part, et la boucle de tabulation se
    // referme sur du vide (repris de `Dialogue`, lot v122).
    // `[inert]` : un sous-arbre décoratif — la page simulée d'un aperçu de
    // modèle, la miniature d'une carte. Le navigateur l'exclut déjà du parcours
    // au clavier ; le sélecteur, lui, l'attrape encore. Sans ce filtre, le
    // premier « focusable » de la fenêtre était un lien de la maquette et la
    // boucle de tabulation se refermait sur des contrôles injoignables.
    const focusables = () =>
      Array.from(boite?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])
        .filter(el => el.offsetParent !== null || el === document.activeElement)
        .filter(el => !el.closest("[inert]"))
    // L'appelant a désigné une cible, sinon le premier champ de saisie s'il y en
    // a un — c'est là qu'on veut être en entrant dans une fenêtre qui demande
    // quelque chose — sinon le premier élément atteignable, sinon le cadre.
    const cible = boite?.matches(FOCUS_INITIAL)
      ? boite
      : boite?.querySelector<HTMLElement>(FOCUS_INITIAL)
        ?? boite?.querySelector<HTMLElement>(CHAMP)
        ?? focusables()[0]
        ?? boite
    // `preventScroll` : une fenêtre qui vient de s'ouvrir est à son point de
    // départ. Faire défiler pour révéler l'élément focusé ne peut, à cet
    // instant, que déplacer ce qu'on voulait montrer.
    cible?.focus({ preventScroll: true })

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
      // `isConnected` : rendre le focus à un élément retiré du document ne fait
      // rien de visible — le focus retombe silencieusement sur `<body>`. Mieux
      // vaut ne rien faire que de croire l'avoir rendu.
      const precedent = focusPrecedent.current
      if (precedent && precedent.isConnected) precedent.focus()
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
