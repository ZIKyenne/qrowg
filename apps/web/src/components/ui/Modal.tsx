"use client"

// Primitive Modal QRowg (design system). Dialogue accessible : rôle dialog +
// aria-modal, PIÈGE DE FOCUS, fermeture Échap, clic sur le scrim, verrou du
// scroll body, RESTAURATION du focus au déclencheur (corrige la lacune a11y des
// modales maison signalée à l'audit). Animation via .mo-pop-in (Motion System).
//
// ── M04, 5 octobre 2026 : une fenêtre centrée n'existe plus sur un téléphone ──
//
// Une boîte flottante au milieu d'un écran de 390 px est le marqueur nº 1 du
// « site de bureau rétréci » : des marges perdues de chaque côté, pas de
// poignée, rien à glisser, et un bouton de validation qui peut passer sous le
// clavier. Sous la rupture `md`, cette primitive rend donc `MobileSheet` — même
// API, même contenu, **aucun appelant à modifier**. Au-dessus, la boîte centrée
// est strictement inchangée : le desktop ne bouge pas d'un pixel.
//
// Pourquoi deux composants plutôt qu'un `if` dans celui-ci : `useDialogue` pose
// un piège de focus, un écouteur d'Échap et un verrou de défilement. Si `Modal`
// l'appelait ET rendait `MobileSheet` — qui l'appelle aussi —, il y aurait deux
// pièges l'un dans l'autre et Échap fermerait deux couches d'un coup. La
// présentation centrée est donc extraite : `Modal` ne fait plus que choisir, et
// n'appelle aucun hook de dialogue.

import { type ReactNode } from "react"
import { useDialogue } from "./useDialogue"
import { useIsMobile } from "@/lib/useIsMobile"
import { MobileSheet } from "@/components/mobile/MobileSheet"

export interface ModalProps {
  open: boolean
  onClose: () => void
  title?: ReactNode
  children: ReactNode
  footer?: ReactNode
  maxWidth?: number
}

export function Modal({ open, onClose, title, children, footer, maxWidth = 460 }: ModalProps) {
  // Décision de COMPORTEMENT (quelle surface monter), pas de disposition : c'est
  // le seul usage de `useIsMobile` que la feuille de route autorise encore.
  const compact = useIsMobile("md")

  if (compact) {
    return (
      <MobileSheet
        open={open}
        titre={title ?? ""}
        // Une fenêtre a une seule taille utile : on ne propose pas de la réduire.
        taille="expanded"
        onTaille={() => {}}
        paliers={false}
        onFermer={onClose}
        safeAreaBasse
        piedDePage={footer}
      >
        <div style={{ padding: "4px 16px 20px", color: "var(--muted)", fontSize: 15, lineHeight: 1.6 }}>
          {children}
        </div>
      </MobileSheet>
    )
  }

  return <FenetreCentree open={open} onClose={onClose} title={title} footer={footer} maxWidth={maxWidth}>{children}</FenetreCentree>
}

/** La fenêtre de bureau, telle qu'elle était avant M04. Rien n'y a changé. */
function FenetreCentree({ open, onClose, title, children, footer, maxWidth = 460 }: ModalProps) {
  // Le comportement (Échap, piège de focus, restitution, verrou du défilement)
  // vit dans useDialogue : quatre fenêtres écrites à la main le partagent.
  const titleId = title ? "qr-modal-title" : undefined
  const { ref: dialogRef, props: dialogProps } = useDialogue(open, onClose, { labelledBy: titleId })

  if (!open) return null
  return (
    <div
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: "fixed", inset: 0, zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(3px)" }}
    >
      <div
        ref={dialogRef}
        {...dialogProps}
        className="mo-pop-in"
        style={{ width: "100%", maxWidth, maxHeight: "90dvh", overflowY: "auto", background: "var(--surface)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 18, boxShadow: "0 24px 70px rgba(0,0,0,0.6)", outline: "none" }}
      >
        {title && (
          <div style={{ padding: "18px 22px 0" }}>
            <h2 id={titleId} style={{ color: "var(--ink)", fontSize: 20, fontWeight: 700, margin: 0 }}>{title}</h2>
          </div>
        )}
        <div style={{ padding: "16px 22px 20px", color: "var(--muted)", fontSize: 14, lineHeight: 1.6 }}>{children}</div>
        {footer && <div style={{ padding: "0 22px 20px", display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>{footer}</div>}
      </div>
    </div>
  )
}
