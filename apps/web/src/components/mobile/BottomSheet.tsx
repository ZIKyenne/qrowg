"use client"

// BottomSheet — panneau mobile qui remonte du bas (un seul ouvert à la fois, géré par l'appelant).
// Scrim, poignée, glisser-pour-fermer, safe-area, prefers-reduced-motion. Style tokens QRowg.
import { useEffect, useRef, useState, type ReactNode } from "react"
import { T } from "./designTokens"

export default function BottomSheet({
  open, onClose, title, right, maxHeight = "76%", children,
}: {
  open: boolean
  onClose: () => void
  title?: ReactNode
  right?: ReactNode          // ex. segment Simple/Expert
  maxHeight?: string
  children: ReactNode
}) {
  const [drag, setDrag] = useState(0)          // translation verticale pendant le glisser
  const startY = useRef<number | null>(null)

  // Fermer sur Échap (clavier / accessibilité).
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  const onTouchStart = (e: React.TouchEvent) => { startY.current = e.touches[0].clientY }
  const onTouchMove = (e: React.TouchEvent) => {
    if (startY.current == null) return
    const dy = e.touches[0].clientY - startY.current
    if (dy > 0) setDrag(dy)                     // ne suit que vers le bas
  }
  const onTouchEnd = () => {
    if (drag > 110) onClose()                   // seuil de fermeture
    setDrag(0); startY.current = null
  }

  const sheetY = open ? drag : 100000           // fermé -> hors écran (translateY énorme)

  return (
    <>
      <style>{`@media (prefers-reduced-motion: reduce){.qf-bs,.qf-scrim{transition:none !important}}`}</style>
      <div className="qf-scrim" onClick={onClose} aria-hidden={!open}
        style={{
          position: "absolute", inset: 0, zIndex: T.z.scrim, background: "rgba(0,0,0,0.45)",
          opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none",
          transition: `opacity ${T.motion.base}ms ease`,
        }} />
      <div className="qf-bs" role="dialog" aria-modal="true"
        style={{
          position: "absolute", left: 0, right: 0, bottom: 0, zIndex: T.z.sheet,
          background: T.color.chrome, borderTopLeftRadius: T.radius.xl, borderTopRightRadius: T.radius.xl,
          borderTop: `1px solid ${T.color.line}`, boxShadow: T.elevation[3],
          transform: `translateY(${open ? drag : 102}${open ? "px" : "%"})`,
          transition: startY.current != null ? "none" : `transform ${T.motion.sheet}ms ${T.ease}`,
          maxHeight, display: "flex", flexDirection: "column",
          paddingBottom: "calc(12px + env(safe-area-inset-bottom))",
          fontFamily: "DM Sans, system-ui, sans-serif", color: T.color.ink,
          visibility: open || drag ? "visible" : "hidden",
        }}>
        {/* Poignée (zone de glisser) */}
        <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
          style={{ padding: "10px 0 2px", flexShrink: 0, cursor: "grab", touchAction: "none" }}>
          <div style={{ width: 44, height: 5, borderRadius: 5, background: "rgba(255,255,255,0.18)", margin: "0 auto" }} />
        </div>
        {(title || right) && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: `6px ${T.space.lg}px ${T.space.md}px`, flexShrink: 0 }}>
            {title && <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, flex: 1 }}>{title}</h3>}
            {right}
            <button type="button" onClick={onClose} aria-label="Fermer"
              style={{ width: 36, height: 36, borderRadius: T.radius.sm, border: "none", background: T.color.chrome2, color: T.color.inkDim, fontSize: 18, cursor: "pointer", flexShrink: 0 }}>×</button>
          </div>
        )}
        <div style={{ overflowY: "auto", padding: `2px ${T.space.lg}px 8px`, WebkitOverflowScrolling: "touch" as any }}>
          {children}
        </div>
      </div>
    </>
  )
}
