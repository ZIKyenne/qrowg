"use client"

// MobileBottomSheet — adaptateur vers la primitive `components/mobile/MobileSheet`.
//
// ── Pourquoi ce fichier ne contient plus de feuille ────────────────────────
//
// Il en contenait une, écrite en juillet 2026, bonne : rôle de dialogue, piège
// de focus, Échap, trois paliers accessibles au bouton, corps défilant avec le
// `minHeight: 0` qui fait fonctionner le défilement sur iOS, safe area, variante
// latérale. Tout cela vit désormais dans la primitive, et sert à tous les écrans
// au lieu d'un seul.
//
// ── Et parce qu'elle était cassée ──────────────────────────────────────────
//
// Le 5 octobre, en lançant les specs e2e du builder mobile — que personne ne
// lançait —, **dix tests sur quatorze échouaient**. Le banc d'essai montrait,
// après un clic sur un onglet de la barre du bas :
//
//     ⚠️ Une erreur est survenue
//     Quelque chose s'est mal passé de notre côté.
//
// La cause est dans l'ancien fichier : `if (!open) return null` était placé
// AVANT `useCallback` et `useDialogue`. Fermée, la feuille appelait trois
// hooks ; ouverte, cinq. React refuse qu'un composant change de nombre de hooks
// d'un rendu à l'autre, et la barrière d'erreur attrapait le plantage.
//
// Autrement dit : **ouvrir un panneau dans l'éditeur mobile faisait tomber
// l'écran**. Le dépôt n'a aucune configuration ESLint, donc `rules-of-hooks`
// n'a jamais rien dit, et les specs qui le prouvaient étaient rouges depuis un
// temps indéterminé.
//
// L'API et les `data-testid` sont conservés à l'identique pour que
// `builder-mobile-shell.spec.ts` reste la preuve, et non une variable de plus.

import type { ReactNode } from "react"
import { MobileSheet } from "@/components/mobile/MobileSheet"
import type { MobileSnap } from "./builderMobile"

export interface MobileBottomSheetProps {
  open: boolean
  title: string
  snap: MobileSnap
  onSnap: (s: MobileSnap) => void
  onClose: () => void
  /** Applique la safe area basse à la sheet (quand la bottom nav est masquée). */
  safeAreaBottom?: boolean
  /** Paysage téléphone : sheet latérale pour garder le canvas visible. */
  side?: boolean
  children: ReactNode
}

export function MobileBottomSheet({ open, title, snap, onSnap, onClose, safeAreaBottom, side, children }: MobileBottomSheetProps) {
  return (
    <MobileSheet
      open={open}
      titre={title}
      taille={snap}
      onTaille={onSnap}
      onFermer={onClose}
      safeAreaBasse={safeAreaBottom}
      laterale={side}
      // L'éditeur cadre lui-même sa feuille dans sa coquille : elle reste
      // `absolute`, comme avant. Ailleurs, la primitive se pose sur l'écran.
      ancrage="absolute"
    >
      {children}
    </MobileSheet>
  )
}
