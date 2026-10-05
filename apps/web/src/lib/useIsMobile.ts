"use client"

import { useCallback, useSyncExternalStore } from "react"
import { RUPTURES, type Rupture } from "./ruptures"

/**
 * Renvoie true quand la largeur de la fenêtre est <= la rupture demandée
 * (par défaut `md`, soit 640 px — l'ancien défaut était 768 px, mais **aucun
 * appel du dépôt ne l'utilisait** : les onze passent tous une valeur explicite).
 * Sert à adapter les styles inline (grilles, paddings, tailles) en mobile, là où
 * les media queries CSS ne s'appliquent pas (styles inline React).
 *
 * Le serveur ne connaît pas l'écran : il rend `false`. Avec `useSyncExternalStore`,
 * React compare la valeur serveur à la vraie valeur PENDANT l'hydratation et
 * corrige le rendu avant la première peinture qui suit — au lieu de peindre la
 * version PC, puis de la remplacer un effet plus tard (mesuré : 270 ms de barre
 * latérale fantôme sur téléphone).
 *
 * Ce que le HTML rendu par le serveur affiche AVANT l'arrivée du JavaScript reste
 * l'affaire du CSS : les éléments réservés à un format portent une classe et une
 * media query (voir DashboardShell : .qf-sidebar / .qf-mobile-nav).
 */
/**
 * Depuis M02 (5 octobre 2026), ce hook accepte une **rupture nommée** :
 * `useIsMobile("md")` plutôt que `useIsMobile(640)`.
 *
 * Pourquoi : le dépôt comptait **27 seuils de largeur distincts**, dont huit
 * passés ici — 620, 700, 768, 859, 860, 900, 1024, 1500. Deux d'entre eux
 * disent la même chose à un pixel près (859 pour le QR Studio, 860 pour la
 * galerie, « aligné sur le shell »). La forme numérique reste acceptée pour ne
 * rien casser, mais `lib/ruptureUnique.test.ts` refuse désormais toute valeur
 * NOUVELLE : la liste des huit est une dette qui n'a le droit que de raccourcir.
 *
 * Et un rappel qui a déjà coûté une régression ici : « mobile » ne se déduit
 * jamais de la seule largeur. La mise à l'échelle Windows à 125 % fait passer un
 * écran de bureau sous 768 px CSS. Pour une décision tactile, combiner avec
 * `pointer: coarse`.
 */
export function useIsMobile(breakpoint: number | Rupture = "md"): boolean {
  const largeur = typeof breakpoint === "number" ? breakpoint : RUPTURES[breakpoint]
  const subscribe = useCallback((notifier: () => void) => {
    const mq = window.matchMedia(`(max-width: ${largeur}px)`)
    mq.addEventListener("change", notifier)
    return () => mq.removeEventListener("change", notifier)
  }, [largeur])
  const getSnapshot = useCallback(() => window.matchMedia(`(max-width: ${largeur}px)`).matches, [largeur])
  return useSyncExternalStore(subscribe, getSnapshot, serveur)
}

const serveur = () => false
