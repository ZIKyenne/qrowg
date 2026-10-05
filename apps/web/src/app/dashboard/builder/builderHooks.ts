import { useState, useRef, useCallback } from "react"
import { ecrire, lire } from "@/lib/memoireDuNavigateur"

// ── Réordonnancement (glisser-déposer) ────────────────────────────────────
// PURE + testable. Déplace l'élément d'index `from` pour qu'il s'insère AVANT la
// position `insertBefore` (0..longueur) exprimée dans le tableau D'ORIGINE.
// Déposer sur soi-même (insertBefore === from ou from+1) = aucun changement.
export function reorderArray<T>(arr: T[], from: number, insertBefore: number): T[] {
  if (from < 0 || from >= arr.length) return arr
  const next = arr.slice()
  const [item] = next.splice(from, 1)
  let dest = insertBefore > from ? insertBefore - 1 : insertBefore
  dest = Math.max(0, Math.min(next.length, dest))
  next.splice(dest, 0, item)
  return next
}

// Clone des blocs avec des identifiants NEUFS (copier/coller, duplication). PURE :
// genId injecté (testable). Copie le contenu (nouvelle référence), préserve le reste.
// Le contenu d'un bloc n'est PAS fait que de chaînes : on y trouve des booléens
// (__visible, __locked), des nombres et des tableaux. La contrainte
// `Record<string, string>` était donc fausse — elle ne passait que parce que le
// mode strict était éteint, et elle rejetait les vrais blocs du produit.
export function cloneBlocks<T extends { id: string; content: Record<string, unknown> }>(items: T[], genId: () => string): T[] {
  return items.map(b => ({ ...b, id: genId(), content: { ...b.content } }))
}

// ── Historique Undo/Redo ─────────────────────────────────────────────────
const MAX_HISTORY = 50
// Fenêtre de coalescing : deux push consécutifs portant la MÊME clé et espacés de
// moins que cette durée fusionnent en une seule entrée d'historique.
export const COALESCE_MS = 600

// Décision de coalescing — PURE (testable sans React, voir builderHooks.test.ts).
// Fusionne uniquement si : une clé est fournie, elle est identique à la précédente,
// on est au sommet de la pile (pas après un undo), et l'écart temporel est court.
export function shouldCoalesce(
  prevKey: string | null,
  prevTime: number,
  nextKey: string | null | undefined,
  now: number,
  atTip: boolean,
  windowMs: number = COALESCE_MS,
): boolean {
  if (nextKey == null) return false
  if (nextKey !== prevKey) return false
  if (!atTip) return false
  return now - prevTime < windowMs
}

export type Historique<T> = {
  get(): T
  push(next: T, coalesceKey?: string | null): void
  reset(next: T): void
  undo(): T | null
  redo(): T | null
  canUndo(): boolean
  canRedo(): boolean
  size(): number
  pos(): number
}

/**
 * Le moteur d'historique, SANS React — donc jouable et vérifiable pas à pas.
 *
 * Pourquoi l'extraire. Le 29 septembre, un visiteur a ouvert un modèle de dix
 * blocs, renommé le premier, puis cliqué sur Annuler : la page est redevenue le
 * squelette générique de trois blocs, titre « Ma Page » compris. Rien dans ce
 * moteur n'était fautif — c'est l'ÉDITEUR qui avait posé le modèle à l'écran
 * sans jamais le dire à son historique, lequel gardait pour seul passé l'état
 * du montage. Ce scénario-là ne se démontre qu'en enchaînant hydratation,
 * modification et annulation ; il fallait donc pouvoir le rejouer hors React
 * (la suite n'a ni DOM ni moteur de rendu de crochets). Voir builderHooks.test.ts.
 *
 * `maintenant` est injecté : le coalescing se teste sans horloge réelle.
 */
export function creerHistorique<T>(initial: T, maintenant: () => number = Date.now): Historique<T> {
  const copie = (v: T): T => JSON.parse(JSON.stringify(v))
  let pile: T[] = [copie(initial)]
  let curseur = 0
  let derniereCle: string | null = null
  let dernierTemps = 0

  return {
    get: () => pile[curseur],
    // `coalesceKey` (optionnel) : ex. "field:<blocId>:<champ>". Les frappes rapides
    // sur le même champ REMPLACENT l'entrée de sommet au lieu d'en empiler une par
    // caractère (corrige la saturation de l'historique). Les opérations structurelles
    // (ajout/suppression/déplacement) n'en passent PAS -> chacune = une entrée.
    push(next, coalesceKey) {
      const now = maintenant()
      const atTip = curseur === pile.length - 1
      const clone = copie(next)
      if (shouldCoalesce(derniereCle, dernierTemps, coalesceKey, now, atTip)) {
        // Remplace l'entrée de sommet (l'état d'AVANT la rafale reste en dessous).
        pile[curseur] = clone
      } else {
        // Tronquer le futur, empiler, limiter.
        pile = pile.slice(0, curseur + 1)
        pile.push(clone)
        if (pile.length > MAX_HISTORY + 1) pile.shift()
        else curseur++
      }
      derniereCle = coalesceKey ?? null
      dernierTemps = now
    },
    // Réinitialise l'historique à un unique état de base (curseur 0). À utiliser à
    // CHAQUE fois qu'un document entre dans l'éditeur — page relue en base, brouillon
    // d'un visiteur, brouillon repris après inscription. Sans ça l'historique garde
    // pour passé les blocs du montage, et la PREMIÈRE annulation les ramène
    // par-dessus le document réel (l'autosave les persisterait) -> perte de contenu.
    reset(next) {
      pile = [copie(next)]
      curseur = 0
      derniereCle = null
    },
    // Annuler et Rétablir rendent une COPIE, jamais l'entrée elle-même : ce qu'ils
    // rendent devient l'état de l'éditeur, et un jour quelqu'un modifiera un bloc
    // sur place. Le passé, lui, ne se réécrit pas. (L'entrée était rendue par
    // référence depuis l'origine ; la copie à l'entrée existait déjà, pas celle-ci.)
    undo() {
      if (curseur > 0) {
        curseur--
        derniereCle = null // toute frappe ultérieure démarre une nouvelle entrée
        return copie(pile[curseur])
      }
      return null
    },
    redo() {
      if (curseur < pile.length - 1) {
        curseur++
        derniereCle = null
        return copie(pile[curseur])
      }
      return null
    },
    canUndo: () => curseur > 0,
    canRedo: () => curseur < pile.length - 1,
    size: () => pile.length,
    pos: () => curseur,
  }
}

// Générique sur T = l'unité d'historique. Le Builder l'utilise avec un SNAPSHOT
// { blocks, theme, name } pour rendre thème et nom de page annulables (pas seulement
// les blocs). T doit être sérialisable en JSON (deep clone).
//
// Coquille React du moteur ci-dessus : elle n'ajoute que le redessin. `push` n'en
// déclenche pas (le changement d'état vient du setter de blocs de l'appelant) ;
// reset/undo/redo si, car eux seuls changent ce que les boutons Annuler/Rétablir
// doivent montrer.
export function useUndoRedo<T>(initial: T) {
  const moteurRef = useRef<Historique<T> | null>(null)
  if (moteurRef.current === null) moteurRef.current = creerHistorique(initial)
  const moteur = moteurRef.current
  const [, forceRender] = useState(0)

  const getState = () => moteur.get()
  const push = useCallback((next: T, coalesceKey?: string | null) => { moteur.push(next, coalesceKey) }, [moteur])
  const reset = useCallback((next: T) => { moteur.reset(next); forceRender(n => n + 1) }, [moteur])
  const undo = useCallback(() => { const v = moteur.undo(); if (v !== null) forceRender(n => n + 1); return v }, [moteur])
  const redo = useCallback(() => { const v = moteur.redo(); if (v !== null) forceRender(n => n + 1); return v }, [moteur])
  const canUndo = () => moteur.canUndo()
  const canRedo = () => moteur.canRedo()
  const size = () => moteur.size()
  const pos = () => moteur.pos()

  return { getState, push, reset, undo, redo, canUndo, canRedo, size, pos }
}

// ── Hook resize panneau ────────────────────────────────────────────────────
export function useResize(key: string, defaultW: number, min: number, max: number) {
  const [width, setWidth] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = lire(`qrfolio_resize_${key}`)
      if (saved) return Math.min(max, Math.max(min, parseInt(saved)))
    }
    return defaultW
  })
  const dragging = useRef(false)
  const startX = useRef(0)
  const startW = useRef(0)

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    dragging.current = true
    startX.current = e.clientX
    startW.current = width
    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"

    const onMove = (ev: MouseEvent) => {
      if (!dragging.current) return
      const delta = ev.clientX - startX.current
      const next = Math.min(max, Math.max(min, startW.current + delta))
      setWidth(next)
    }
    const onUp = () => {
      dragging.current = false
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
      setWidth(prev => {
        ecrire(`qrfolio_resize_${key}`, String(prev))
        return prev
      })
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
    }
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
  }, [width, min, max, key])

  return { width, onMouseDown }
}
