"use client"
// ticketing — L'apercu dessinait la carte de billetterie complete, bouton
// « Acheter mes billets » compris, meme entierement vide : le commercant voyait
// une billetterie que la page ne publiait pas.
import { billetterie } from "../../models/evenement"
import { PublicCtaLink, EditorCtaShell } from "../../primitives/BlockCtaLink"
import { BlockEmptyState, HIDDEN_WHEN_EMPTY_NOTE } from "../../primitives/BlockEmptyState"
import { sz, editorCtx, publicCtx, type UnifiedCtx, type EditorAdapterProps, type PublicAdapterProps } from "../../renderTypes"

const VIOLET = "#9146FF"

function Vue({ u, c }: { u: UnifiedCtx; c: Record<string, any> }) {
  const b = billetterie(c)!
  const bouton = { display: "block", background: VIOLET, borderRadius: 11, padding: `${sz(u, 13)}px`, textAlign: "center" as const, fontSize: sz(u, 14), fontWeight: 700, color: "#fff", textDecoration: "none", fontFamily: u.FONT_B }
  return (
    <div style={{ padding: `${sz(u, 10)}px ${sz(u, 24)}px ${sz(u, 14)}px`, fontFamily: u.FONT_B }}>
      <div style={{ background: `${VIOLET}14`, border: `1.5px solid ${VIOLET}4d`, borderRadius: 15, padding: sz(u, 17) }}>
        <div style={{ display: "flex", gap: sz(u, 13), alignItems: "flex-start", marginBottom: b.cta ? sz(u, 15) : 0 }}>
          <span aria-hidden style={{ fontSize: sz(u, 34), flexShrink: 0 }}>🎟️</span>
          <div>
            {b.nom && <p style={{ color: u.TEXT, fontSize: sz(u, 15), fontWeight: 700, margin: `0 0 ${sz(u, 3)}px`, fontFamily: u.FONT_B }}>{b.nom}</p>}
            {b.date && <p style={{ color: u.MUTED, fontSize: sz(u, 12), margin: `0 0 ${sz(u, 2)}px`, fontFamily: u.FONT_B }}>📅 {b.date}</p>}
            {b.lieu && <p style={{ color: u.MUTED, fontSize: sz(u, 12), margin: `0 0 ${sz(u, 2)}px`, fontFamily: u.FONT_B }}>📍 {b.lieu}</p>}
            {b.prix && <p style={{ color: VIOLET, fontSize: sz(u, 13), fontWeight: 700, margin: 0, fontFamily: u.FONT_B }}>💶 {b.prix}</p>}
          </div>
        </div>
        {b.cta && (u.mode === "public"
          ? <PublicCtaLink href={b.cta.href} external={/^https?:/i.test(b.cta.href)} trackTarget={b.cta.href} trackClick={u.trackClick} style={bouton}>{b.cta.label}</PublicCtaLink>
          : <EditorCtaShell style={bouton}>{b.cta.label}</EditorCtaShell>)}
      </div>
    </div>
  )
}

export function EditorTicketing({ content, ctx }: EditorAdapterProps) {
  const u = editorCtx(ctx)
  if (!billetterie(content)) return <div style={{ padding: "10px 16px" }}><BlockEmptyState icon="🎟️" label="Nommez l’événement ou donnez le lien de billetterie" sub={HIDDEN_WHEN_EMPTY_NOTE} muted={u.MUTED} /></div>
  return <Vue u={u} c={content} />
}
export function PublicTicketing({ content, ctx }: PublicAdapterProps) {
  if (!billetterie(content)) return null
  return <Vue u={publicCtx(ctx)} c={content} />
}
