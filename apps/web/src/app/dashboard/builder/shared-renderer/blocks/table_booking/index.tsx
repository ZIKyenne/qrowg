"use client"
// table_booking — « Réserver une table » vers TheFork, Zenchef, OpenTable…
// Vague 2 : la couleur du thème, rendue lisible sur le fond de la page — plus
// le rouge en dur, à 3,8 : 1 sur fond blanc. L'aperçu, lui, était resté rouge.
import { reservationDeTable } from "../../models/actionsExternes"
import { SmartCta } from "../../primitives/LayoutSurface"
import { BlockEmptyState, HIDDEN_WHEN_EMPTY_NOTE } from "../../primitives/BlockEmptyState"
import { sz, editorCtx, publicCtx, type UnifiedCtx, type EditorAdapterProps, type PublicAdapterProps } from "../../renderTypes"

function Vue({ u, m }: { u: UnifiedCtx; m: NonNullable<ReturnType<typeof reservationDeTable>> }) {
  const encre = u.lisible(u.G)
  return (
    <div style={{ padding: `${sz(u, 6)}px ${sz(u, 24)}px ${sz(u, 12)}px`, fontFamily: u.FONT_B }}>
      <SmartCta u={u} href={m.href} marqueur="reserver" label={<><span aria-hidden style={{ fontSize: sz(u, 17) }}>🍽️</span><span style={{ color: encre, fontSize: sz(u, 14), fontWeight: 700, fontFamily: u.FONT_B }}>{m.label}</span></>}
        style={{ display: "flex", width: "100%", alignItems: "center", justifyContent: "center", gap: sz(u, 9), background: `color-mix(in srgb, ${encre} 10%, transparent)`, border: `1.5px solid color-mix(in srgb, ${encre} 35%, transparent)`, borderRadius: sz(u, 13), padding: `${sz(u, 15)}px ${sz(u, 18)}px`, textDecoration: "none" }} />
      {m.plateforme && <p style={{ color: u.MUTED, fontSize: sz(u, 11), margin: `${sz(u, 4)}px 0 0`, textAlign: "center" }}>via {m.plateforme}</p>}
    </div>
  )
}

export function EditorTableBooking({ content, ctx }: EditorAdapterProps) {
  const u = editorCtx(ctx)
  const m = reservationDeTable(content)
  if (!m) return <div style={{ padding: "10px 16px" }}><BlockEmptyState icon="🍽️" label="Ajoutez le lien de réservation" sub={HIDDEN_WHEN_EMPTY_NOTE} muted={u.MUTED} /></div>
  return <Vue u={u} m={m} />
}
export function PublicTableBooking({ content, ctx }: PublicAdapterProps) {
  const m = reservationDeTable(content)
  return m ? <Vue u={publicCtx(ctx)} m={m} /> : null
}
