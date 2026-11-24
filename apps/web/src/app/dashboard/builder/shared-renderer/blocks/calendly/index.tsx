"use client"
// calendly — Une carte « réserver un créneau » vers l'agenda en ligne.
import { agendaEnLigne } from "../../models/actionsExternes"
import { SmartCta } from "../../primitives/LayoutSurface"
import { BlockEmptyState, HIDDEN_WHEN_EMPTY_NOTE } from "../../primitives/BlockEmptyState"
import { sz, editorCtx, publicCtx, type UnifiedCtx, type EditorAdapterProps, type PublicAdapterProps } from "../../renderTypes"

function Vue({ u, m }: { u: UnifiedCtx; m: NonNullable<ReturnType<typeof agendaEnLigne>> }) {
  return (
    <div style={{ padding: `${sz(u, 6)}px ${sz(u, 24)}px ${sz(u, 16)}px`, fontFamily: u.FONT_B }}>
      <div style={{ background: `${u.G}07`, border: `1px solid ${u.G}20`, borderRadius: sz(u, 14), padding: `${sz(u, 16)}px ${sz(u, 18)}px` }}>
        {(m.titre || m.description) && (
          <div style={{ display: "flex", gap: sz(u, 12), marginBottom: sz(u, 12) }}>
            <div aria-hidden style={{ width: sz(u, 42), height: sz(u, 42), background: `${u.G}12`, border: `1px solid ${u.G}25`, borderRadius: sz(u, 10), display: "flex", alignItems: "center", justifyContent: "center", fontSize: sz(u, 20), flexShrink: 0 }}>📅</div>
            <div>
              {m.titre && <h2 style={{ color: u.TEXT, fontSize: sz(u, 14), fontWeight: 700, margin: 0, fontFamily: u.FONT_B }}>{m.titre}</h2>}
              {m.description && <p style={{ color: u.MUTED, fontSize: sz(u, 13.5), margin: 0 }}>{m.description}</p>}
            </div>
          </div>
        )}
        <SmartCta u={u} href={m.href} label="Réserver un créneau"
          style={{ display: "block", background: `linear-gradient(90deg,${u.G},${u.G}cc)`, color: "#080808", textAlign: "center", padding: sz(u, 13), borderRadius: sz(u, 9), textDecoration: "none", fontSize: sz(u, 14), fontWeight: 700, fontFamily: u.FONT_B }} />
      </div>
    </div>
  )
}

export function EditorCalendly({ content, ctx }: EditorAdapterProps) {
  const u = editorCtx(ctx)
  const m = agendaEnLigne(content)
  if (!m) return <div style={{ padding: "10px 16px" }}><BlockEmptyState icon="📅" label="Ajoutez le lien de votre agenda" sub={HIDDEN_WHEN_EMPTY_NOTE} muted={u.MUTED} /></div>
  return <Vue u={u} m={m} />
}
export function PublicCalendly({ content, ctx }: PublicAdapterProps) {
  const m = agendaEnLigne(content)
  return m ? <Vue u={publicCtx(ctx)} m={m} /> : null
}
