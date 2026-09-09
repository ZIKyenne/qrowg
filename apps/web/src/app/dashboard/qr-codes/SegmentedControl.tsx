"use client"

// Sélecteur segmenté (8 septembre, maquette) : indicateur qui glisse sous l'option active,
// surface claire + encre + filet d'accent — plus de halo qui respire ni de reflet doré.
// N options ; a11y (tablist/tab + flèches + focus) ; reduced-motion.
import { useRef, useState } from "react"

export function SegmentedControl({
  labels, value, onChange, ariaLabel, dense = false,
}: {
  labels: string[]
  value: number
  onChange: (index: number, label: string) => void
  ariaLabel?: string
  dense?: boolean   // contexte étroit (inspecteur) : réduit typo/padding (cf. note responsive du handoff)
}) {
  const [moves, setMoves] = useState(0)
  const n = Math.max(1, labels.length)
  const refs = useRef<(HTMLButtonElement | null)[]>([])

  function select(i: number) {
    if (i === value) return              // clic sur l'option active = no-op (pas de rejeu)
    setMoves(m => m + 1)
    onChange(i, labels[i])
  }
  function onKey(e: React.KeyboardEvent) {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return
    e.preventDefault()
    const ni = (value + (e.key === "ArrowRight" ? 1 : -1) + n) % n
    select(ni); refs.current[ni]?.focus()
  }

  return (
    <div style={{ position: "relative", display: "inline-flex", width: "100%", maxWidth: 440 }}>
      <style>{`
        .sc-tab:focus-visible{outline:none;box-shadow:0 0 0 3px color-mix(in srgb, var(--accent) 35%, transparent)}
        @media (prefers-reduced-motion: reduce){ .sc-thumb{transition-duration:.01ms!important} }
      `}</style>

      {/* Rail */}
      <div role="tablist" aria-label={ariaLabel} onKeyDown={onKey} style={{ position: "relative", display: "grid", gridAutoFlow: "column", gridAutoColumns: "1fr", width: "100%", padding: 3, borderRadius: 9, background: "var(--field)", border: "1px solid var(--line)", isolation: "isolate" }}>

        {/* Indicateur glissant */}
        <div aria-hidden="true" className="sc-thumb" data-moves={moves} style={{ position: "absolute", top: 3, bottom: 3, left: 3, width: `calc((100% - 6px) / ${n})`, transform: `translateX(calc(${value} * 100%))`, transition: "transform .2s cubic-bezier(.2,.85,.2,1)", borderRadius: 7, background: "var(--surface-2)", border: "1px solid var(--line-strong)", boxShadow: "inset 0 -2px 0 var(--accent)", boxSizing: "border-box", pointerEvents: "none" }} />

        {/* Options */}
        {labels.map((l, i) => {
          const on = i === value
          return (
            <button key={l} ref={el => { refs.current[i] = el }} role="tab" aria-selected={on} tabIndex={on ? 0 : -1} type="button" onClick={() => select(i)} className="sc-tab"
              style={{ position: "relative", zIndex: 1, appearance: "none", border: "none", background: "transparent", cursor: "pointer", padding: dense ? "8px 6px" : "11px 18px", borderRadius: 7, fontFamily: "inherit", fontSize: dense ? 12 : 14, fontWeight: on ? 600 : 500, color: on ? "var(--ink)" : "var(--muted)", transition: "color .2s ease, font-weight .18s ease", whiteSpace: "nowrap" }}>
              {l}
            </button>
          )
        })}
      </div>
    </div>
  )
}
