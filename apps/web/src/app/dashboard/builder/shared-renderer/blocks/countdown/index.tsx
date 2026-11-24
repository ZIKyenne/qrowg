"use client"
// countdown — Le temps qui reste avant une date (offre, ouverture, événement).
//
// L'heure ne se lit qu'APRES le montage. Le serveur rend la page, puis la met
// en cache 60 s (ISR) : ses chiffres sont donc vieux de 0 à 60 secondes quand
// le navigateur hydrate. Avec un `Date.now()` à l'initialisation, le texte du
// serveur et celui du client différaient à coup sûr — React #418 — et React
// jetait le HTML du serveur pour tout refaire côté client. Avant le montage :
// la boîte, ses libellés, et des tirets à la place des chiffres ; jamais
// « Offre terminée » affiché à tort depuis un cache.
import { useEffect, useState } from "react"
import { countdownParts } from "../../../types"
import { compteARebours, type CompteARebours } from "../../models/affichagesSimples"
import { SmartCta } from "../../primitives/LayoutSurface"
import { BlockEmptyState, HIDDEN_WHEN_EMPTY_NOTE } from "../../primitives/BlockEmptyState"
import { sz, editorCtx, publicCtx, type UnifiedCtx, type EditorAdapterProps, type PublicAdapterProps } from "../../renderTypes"

function Vue({ u, m }: { u: UnifiedCtx; m: CompteARebours }) {
  const targetMs = m.cibleMs
  const [now, setNow] = useState<number | null>(null)
  useEffect(() => {
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [targetMs])
  const p = now === null ? null : countdownParts(targetMs, now)
  const units: [string, number | null][] = [["Jours", p && p.days], ["Heures", p && p.hours], ["Min", p && p.mins], ["Sec", p && p.secs]]
  const a = m.accent
  return (
    <div style={{ padding: `${sz(u, 14)}px ${sz(u, 16)}px` }}>
      <div style={{ background: `linear-gradient(135deg,${a}22,${a}0d)`, border: `1px solid ${a}55`, borderRadius: sz(u, 14), padding: `${sz(u, 18)}px ${sz(u, 16)}px`, textAlign: "center" }}>
        {m.titre && <h2 style={{ color: u.TEXT, fontSize: sz(u, 18), fontWeight: 800, margin: `0 0 ${sz(u, 4)}px`, fontFamily: u.FONT_D, lineHeight: 1.25 }}>{m.titre}</h2>}
        {m.sousTitre && <p style={{ color: u.MUTED, fontSize: sz(u, 13), margin: `0 0 ${sz(u, 14)}px`, fontFamily: u.FONT_B }}>{m.sousTitre}</p>}
        {p?.expired
          ? <p style={{ color: a, fontSize: sz(u, 17), fontWeight: 800, margin: `${sz(u, 8)}px 0 0`, fontFamily: u.FONT_D }}>{m.fin}</p>
          : <div style={{ display: "flex", justifyContent: "center", gap: sz(u, 10) }} role="timer" aria-label="Compte à rebours">
              {units.map(([lbl, val]) => (
                // Un voile noir sur un thème clair donnait des cases gris sale.
                <div key={lbl} style={{ minWidth: sz(u, 62), background: u.light ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.28)", border: `1px solid ${a}33`, borderRadius: sz(u, 11), padding: `${sz(u, 10)}px ${sz(u, 6)}px` }}>
                  <div style={{ color: a, fontSize: sz(u, 26), fontWeight: 800, fontVariantNumeric: "tabular-nums", lineHeight: 1, fontFamily: u.FONT_D }}>{val === null ? "––" : String(val).padStart(2, "0")}</div>
                  <div style={{ color: u.MUTED, fontSize: sz(u, 11), marginTop: sz(u, 4), textTransform: "uppercase", letterSpacing: 0.6, fontFamily: u.FONT_B }}>{lbl}</div>
                </div>
              ))}
            </div>}
        {!p?.expired && m.cta && (
          <SmartCta u={u} href={m.cta.href} external={false} trackTarget={m.cta.href} label={m.cta.label}
            style={{ display: "inline-block", marginTop: sz(u, 16), background: a, color: "#fff", padding: `${sz(u, 11)}px ${sz(u, 24)}px`, borderRadius: sz(u, 9), textDecoration: "none", fontSize: sz(u, 14), fontWeight: 700, fontFamily: u.FONT_B }} />
        )}
      </div>
    </div>
  )
}

export function EditorCountdown({ content, ctx }: EditorAdapterProps) {
  const u = editorCtx(ctx)
  const m = compteARebours(content)
  if (!m) return <div style={{ padding: "10px 16px" }}><BlockEmptyState icon="⏳" label="Donnez la date à atteindre" sub={HIDDEN_WHEN_EMPTY_NOTE} muted={u.MUTED} /></div>
  return <Vue u={u} m={m} />
}
export function PublicCountdown({ content, ctx }: PublicAdapterProps) {
  const m = compteARebours(content)
  if (!m) return null
  return <Vue u={publicCtx(ctx)} m={m} />
}
