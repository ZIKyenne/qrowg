"use client"

// =============================================================================
// BigSlider.tsx — Curseur tactile "gros doigt" (critique #6).
// Piste epaisse, valeur affichee en GROS, boutons - / +, double-tap = reset.
// Utilise dans les sheets focalises (Taille, Opacite, Espacement...).
// =============================================================================

import { useRef } from "react"

const GOLD = "#C9A84C"

type Props = {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
  resetTo?: number            // valeur de reinitialisation (double-tap sur la valeur)
  format?: (v: number) => string
  dark?: boolean
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))
const round = (v: number, step: number) => {
  const inv = 1 / step
  return Math.round(v * inv) / inv
}

export default function BigSlider({ label, value, min, max, step, onChange, resetTo, format, dark = false }: Props) {
  const lastTap = useRef(0)
  const T = dark
    ? { ink: "#ECE8E0", sub: "#9B9385", field: "rgba(255,255,255,0.06)", line: "rgba(255,255,255,0.14)" }
    : { ink: "#1F2430", sub: "#6B7280", field: "#EDEFF3", line: "rgba(0,0,0,0.1)" }

  const set = (v: number) => onChange(clamp(round(v, step), min, max))
  const bump = (dir: -1 | 1) => set(value + dir * step)
  const onValueTap = () => {
    if (resetTo === undefined) return
    // pas de Date.now() interdit ici ? c'est un composant runtime -> autorise
    const now = Date.now()
    if (now - lastTap.current < 300) { onChange(clamp(resetTo, min, max)); lastTap.current = 0 }
    else lastTap.current = now
  }
  const btn = {
    width: 44, height: 44, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
    borderRadius: 12, border: `1px solid ${T.line}`, background: T.field, color: T.ink,
    fontSize: 22, fontWeight: 700, cursor: "pointer", lineHeight: 1,
  } as const

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ color: T.sub, fontSize: 12, fontWeight: 700 }}>{label}</span>
        <span onClick={onValueTap} title={resetTo !== undefined ? "Double-tap pour réinitialiser" : undefined}
          style={{ color: T.ink, fontSize: 22, fontWeight: 800, fontVariantNumeric: "tabular-nums", cursor: resetTo !== undefined ? "pointer" : "default", userSelect: "none" }}>
          {format ? format(value) : Math.round(value)}
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button type="button" onClick={() => bump(-1)} aria-label="Diminuer" style={btn}>−</button>
        <input type="range" min={min} max={max} step={step} value={value}
          onChange={e => set(parseFloat(e.target.value))}
          style={{ flex: 1, height: 30, accentColor: GOLD, cursor: "pointer" }} />
        <button type="button" onClick={() => bump(1)} aria-label="Augmenter" style={btn}>+</button>
      </div>
    </div>
  )
}
