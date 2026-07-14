"use client"

// MobileDock — barre d'outils basse (type Canva/CapCut). Grosses cibles icône+libellé,
// défilement horizontal, état actif, retour haptique. Chaque outil ouvre un BottomSheet.
import type { ReactNode } from "react"
import { T } from "./designTokens"

export type DockTool = { id: string; icon: ReactNode; label: string }

function haptic() {
  try { if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(8) } catch { /* ignore */ }
}

export default function MobileDock({ tools, active, onSelect }: {
  tools: DockTool[]
  active: string | null
  onSelect: (id: string) => void
}) {
  return (
    <div style={{
      flexShrink: 0, background: T.color.chrome, borderTop: `1px solid ${T.color.line}`,
      padding: `${T.space.sm}px 6px calc(${T.space.sm}px + env(safe-area-inset-bottom))`,
      zIndex: T.z.dock,
    }}>
      <div style={{ display: "flex", gap: 2, overflowX: "auto", overflowY: "hidden", scrollbarWidth: "none" as any, touchAction: "pan-x", overscrollBehaviorX: "contain", WebkitOverflowScrolling: "touch" }}>
        {tools.map(t => {
          const on = active === t.id
          return (
            <button key={t.id} type="button" aria-pressed={on}
              onClick={() => { haptic(); onSelect(t.id) }}
              style={{
                flex: "0 0 auto", minWidth: 66, minHeight: 60, border: "none", background: on ? T.color.goldSoft : "transparent",
                borderRadius: T.radius.md, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                gap: 5, cursor: "pointer", color: on ? T.color.gold : T.color.inkDim,
                transition: `transform ${T.motion.fast}ms, background .15s, color .15s`,
                fontFamily: "DM Sans, system-ui, sans-serif",
              }}
              onTouchStart={e => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.92)" }}
              onTouchEnd={e => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)" }}>
              <span style={{ fontSize: 21, lineHeight: 1 }} aria-hidden>{t.icon}</span>
              <span style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: 0.2 }}>{t.label}</span>
            </button>
          )
        })}
        <span aria-hidden style={{ flex: "0 0 20px" }} />
      </div>
    </div>
  )
}
