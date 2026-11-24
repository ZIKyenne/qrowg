"use client"
// booking_button — « Prendre rendez-vous » vers l'outil du commerçant.
// L'aperçu le peignait en bleu ; la page, dans la couleur du thème.
import { priseDeRendezVous } from "../../models/actionsExternes"
import { SmartCta } from "../../primitives/LayoutSurface"
import { BlockEmptyState, HIDDEN_WHEN_EMPTY_NOTE } from "../../primitives/BlockEmptyState"
import { sz, editorCtx, publicCtx, type UnifiedCtx, type EditorAdapterProps, type PublicAdapterProps } from "../../renderTypes"

function Vue({ u, m }: { u: UnifiedCtx; m: NonNullable<ReturnType<typeof priseDeRendezVous>> }) {
  return (
    <div style={{ padding: `${sz(u, 6)}px ${sz(u, 24)}px ${sz(u, 10)}px`, fontFamily: u.FONT_B }}>
      <SmartCta u={u} href={m.href} trackTarget="booking" label={<><span aria-hidden>📅</span> {m.label}</>}
        style={{ display: "flex", width: "100%", alignItems: "center", justifyContent: "center", gap: sz(u, 9), background: `${u.G}12`, border: `1.5px solid ${u.G}35`, borderRadius: sz(u, 13), padding: `${sz(u, 15)}px ${sz(u, 18)}px`, textDecoration: "none", color: u.lisible(u.G), fontSize: sz(u, 15), fontWeight: 700, fontFamily: u.FONT_B }} />
      {m.description && <p style={{ color: u.MUTED, fontSize: sz(u, 13), margin: `${sz(u, 6)}px 0 0`, textAlign: "center" }}>{m.description}</p>}
      {m.plateforme && <p style={{ color: u.MUTED, fontSize: sz(u, 11), margin: `${sz(u, 4)}px 0 0`, textAlign: "center" }}>via {m.plateforme}</p>}
    </div>
  )
}

export function EditorBookingButton({ content, ctx }: EditorAdapterProps) {
  const u = editorCtx(ctx)
  const m = priseDeRendezVous(content)
  if (!m) return <div style={{ padding: "10px 16px" }}><BlockEmptyState icon="📅" label="Ajoutez le lien de prise de rendez-vous" sub={HIDDEN_WHEN_EMPTY_NOTE} muted={u.MUTED} /></div>
  return <Vue u={u} m={m} />
}
export function PublicBookingButton({ content, ctx }: PublicAdapterProps) {
  const m = priseDeRendezVous(content)
  return m ? <Vue u={publicCtx(ctx)} m={m} /> : null
}
