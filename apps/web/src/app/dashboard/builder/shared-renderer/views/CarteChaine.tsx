"use client"
// Vue partagée de la famille « chaînes et réseaux ». Chaque bloc garde son
// habillage (couleurs, icône, forme) mais tous suivent les MÊMES règles :
// le bouton n'existe qu'avec une destination, il porte le même libellé des deux
// côtés, et le canvas rend une coquille inerte là où la page rend un lien.
import { PublicCtaLink, EditorCtaShell } from "../primitives/BlockCtaLink"
import { sz, type UnifiedCtx } from "../renderTypes"
import type { Chaine } from "../models/chaines"
import type { CSSProperties } from "react"

export function BoutonChaine({ u, ch, style }: { u: UnifiedCtx; ch: Chaine; style: CSSProperties }) {
  return u.mode === "public"
    ? <PublicCtaLink href={ch.cta.href} external={/^https?:/i.test(ch.cta.href)} trackTarget={ch.cta.href} trackClick={u.trackClick} style={style}>{ch.cta.label}</PublicCtaLink>
    : <EditorCtaShell style={style}>{ch.cta.label}</EditorCtaShell>
}

export function CarteChaine({ u, ch, icone, fond, bordure, rayonIcone, fondIcone, bouton }: {
  u: UnifiedCtx; ch: Chaine; icone: string
  fond: string; bordure: string; rayonIcone: number | string; fondIcone: string
  bouton: CSSProperties
}) {
  return (
    <div style={{ padding: `${sz(u, 10)}px ${sz(u, 24)}px ${sz(u, 12)}px`, fontFamily: u.FONT_B }}>
      <div style={{ background: fond, border: `1.5px solid ${bordure}`, borderRadius: 13, padding: sz(u, 15) }}>
        <div style={{ display: "flex", alignItems: "center", gap: sz(u, 11), marginBottom: sz(u, 11) }}>
          <div aria-hidden style={{ width: sz(u, 44), height: sz(u, 44), borderRadius: rayonIcone, background: fondIcone, display: "flex", alignItems: "center", justifyContent: "center", fontSize: sz(u, 23), flexShrink: 0 }}>{icone}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: sz(u, 7) }}>
              {ch.nom && <p style={{ color: u.TEXT, fontSize: sz(u, 14), fontWeight: 700, margin: 0, fontFamily: u.FONT_B }}>{ch.nom}</p>}
              {ch.enDirect && <span style={{ background: "#EF4444", color: "#fff", borderRadius: 4, padding: `${sz(u, 1)}px ${sz(u, 6)}px`, fontSize: sz(u, 9), fontWeight: 700, fontFamily: u.FONT_B }}>● LIVE</span>}
            </div>
            {ch.lignes.map((l, i) => (
              <p key={i} style={{ color: l.couleur ?? u.MUTED, fontSize: sz(u, 11), margin: 0, fontFamily: u.FONT_B }}>{l.icone ? l.icone + " " : ""}{l.texte}</p>
            ))}
          </div>
        </div>
        <BoutonChaine u={u} ch={ch} style={bouton} />
      </div>
    </div>
  )
}
