"use client"

// =============================================================================
// ColorPicker.tsx — Selecteur de couleurs avance (critique #14).
// Teinte / Saturation / Luminosite, saisie hex, pipette (EyeDropper si dispo),
// palette de marque, harmonies (complementaire / analogues / triade), recentes.
// Toute la logique couleur vient de colorTools.ts (pur, teste).
// =============================================================================

import { useEffect, useState } from "react"
import { normalizeHex, hexToHsl, hslToHex, harmonies, type HSL } from "./colorTools"

const GOLD = "#C9A84C"

type Props = {
  value: string
  onChange: (hex: string) => void          // mise a jour live (glisser d'un curseur)
  onUseColor?: (hex: string) => void        // choix "valide" -> a pousser dans les recentes
  recent?: string[]
  brand?: string[]
}

export default function ColorPicker({ value, onChange, onUseColor, recent = [], brand = [] }: Props) {
  const [hsl, setHsl] = useState<HSL>(() => hexToHsl(value) ?? { h: 45, s: 60, l: 45 })
  const [hex, setHex] = useState(normalizeHex(value) ?? "#C9A84C")

  // Resynchronise si la couleur change depuis l'exterieur (pastille du parent, etc.).
  useEffect(() => {
    const n = normalizeHex(value)
    if (n && n !== hex) { setHex(n); const h = hexToHsl(n); if (h) setHsl(h) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const commit = (h: string) => {
    const n = normalizeHex(h); if (!n) return
    setHex(n); const hs = hexToHsl(n); if (hs) setHsl(hs)
    onChange(n); onUseColor?.(n)
  }
  const setChannel = (patch: Partial<HSL>) => {
    const next = { ...hsl, ...patch }; setHsl(next)
    const h = hslToHex(next); setHex(h); onChange(h)
  }

  const canEyedrop = typeof window !== "undefined" && "EyeDropper" in window
  const eyedrop = async () => {
    try { const ed = new (window as unknown as { EyeDropper: new () => { open: () => Promise<{ sRGBHex: string }> } }).EyeDropper(); const r = await ed.open(); commit(r.sRGBHex) } catch { /* annule */ }
  }

  const harm = harmonies(hex)
  const sw = (c: string, onClick: () => void, active = false) => (
    <button type="button" onClick={onClick} title={c}
      style={{ width: 22, height: 22, borderRadius: "50%", cursor: "pointer", background: c, border: active ? `2px solid ${GOLD}` : "1px solid rgba(0,0,0,0.18)", padding: 0, flexShrink: 0 }} />
  )
  const label = (t: string) => <p style={{ color: "#6B7280", fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, margin: "10px 0 5px" }}>{t}</p>

  return (
    <div style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 12, padding: 12, marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ width: 34, height: 34, borderRadius: 8, background: hex, border: "1px solid rgba(0,0,0,0.15)", flexShrink: 0 }} />
        <input value={hex} onChange={e => setHex(e.target.value)} onBlur={() => commit(hex)} onKeyDown={e => { if (e.key === "Enter") commit(hex) }}
          aria-label="Code couleur hexadecimal"
          style={{ flex: 1, minWidth: 0, background: "#F4F6F8", border: "1px solid rgba(0,0,0,0.1)", borderRadius: 7, padding: "8px 9px", color: "#1F2430", fontSize: 12, fontFamily: "monospace", outline: "none", boxSizing: "border-box" }} />
        {canEyedrop && (
          <button type="button" onClick={eyedrop} title="Pipette (prelever une couleur a l'ecran)" aria-label="Pipette"
            style={{ width: 34, height: 34, borderRadius: 8, border: "1px solid rgba(0,0,0,0.12)", background: "#F4F6F8", cursor: "pointer", fontSize: 15, flexShrink: 0 }}>🖊️</button>
        )}
      </div>

      {label("Teinte")}
      <input type="range" min={0} max={360} value={hsl.h} onChange={e => setChannel({ h: parseInt(e.target.value) })}
        style={{ width: "100%", accentColor: GOLD }} />
      {label("Saturation")}
      <input type="range" min={0} max={100} value={hsl.s} onChange={e => setChannel({ s: parseInt(e.target.value) })}
        style={{ width: "100%", accentColor: GOLD }} />
      {label("Luminosité")}
      <input type="range" min={0} max={100} value={hsl.l} onChange={e => setChannel({ l: parseInt(e.target.value) })}
        style={{ width: "100%", accentColor: GOLD }} />

      {label("Harmonies")}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
        {sw(harm.complementary, () => commit(harm.complementary))}
        {harm.analogous.map(c => <span key={"an" + c}>{sw(c, () => commit(c))}</span>)}
        {harm.triadic.map(c => <span key={"tr" + c}>{sw(c, () => commit(c))}</span>)}
      </div>

      {brand.length > 0 && (<>
        {label("Palette")}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
          {brand.map(c => <span key={"br" + c}>{sw(c, () => commit(c), normalizeHex(c) === hex)}</span>)}
        </div>
      </>)}

      {recent.length > 0 && (<>
        {label("Récentes")}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
          {recent.map(c => <span key={"re" + c}>{sw(c, () => commit(c))}</span>)}
        </div>
      </>)}
    </div>
  )
}
