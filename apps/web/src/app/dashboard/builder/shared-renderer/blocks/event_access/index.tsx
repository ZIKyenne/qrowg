"use client"
// event_access — Le plan d'acces. Sans plan NI adresse, l'apercu dessinait quand
// meme un cadre de carte de 130 px avec une mappemonde dedans : le commercant
// croyait avoir un plan, la page n'en publiait aucun.
import { acces } from "../../models/evenement"
import { BlockEmptyState, HIDDEN_WHEN_EMPTY_NOTE } from "../../primitives/BlockEmptyState"
import { sz, editorCtx, publicCtx, type UnifiedCtx, type EditorAdapterProps, type PublicAdapterProps } from "../../renderTypes"

const ROSE = "#EC4899"

function Vue({ u, c }: { u: UnifiedCtx; c: Record<string, any> }) {
  const a = acces(c)!
  return (
    <div style={{ padding: `${sz(u, 10)}px ${sz(u, 24)}px ${sz(u, 14)}px`, fontFamily: u.FONT_B }}>
      {a.titre && <p style={{ color: u.MUTED, fontSize: sz(u, 11), textTransform: "uppercase", letterSpacing: 2, margin: `0 0 ${sz(u, 10)}px`, fontFamily: u.FONT_B }}>{a.titre}</p>}
      {a.plan
        ? <iframe src={a.plan} title={a.titre || "Plan d’accès"} width="100%" height={sz(u, 180)} style={{ border: "none", borderRadius: 13, display: "block", marginBottom: sz(u, 11) }} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
        : a.adresse
          ? <div style={{ background: `${ROSE}0f`, border: `1px solid ${ROSE}33`, borderRadius: 13, padding: sz(u, 18), display: "flex", flexDirection: "column", alignItems: "center", gap: sz(u, 7), marginBottom: sz(u, 11) }}>
              <span aria-hidden style={{ fontSize: sz(u, 30) }}>🗺️</span>
              <p style={{ color: u.MUTED, fontSize: sz(u, 12), margin: 0, textAlign: "center", fontFamily: u.FONT_B }}>📍 {a.adresse}</p>
            </div>
          : null}
      {a.transports.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: sz(u, 7) }}>
          {a.transports.map((t, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: sz(u, 11), background: u.FILL, border: `1px solid ${u.LINE}`, borderRadius: 10, padding: `${sz(u, 10)}px ${sz(u, 13)}px` }}>
              <span aria-hidden style={{ fontSize: sz(u, 19) }}>{t.icone}</span>
              <span style={{ color: u.TEXT, fontSize: sz(u, 13), fontFamily: u.FONT_B }}>{t.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function EditorEventAccess({ content, ctx }: EditorAdapterProps) {
  const u = editorCtx(ctx)
  if (!acces(content)) return <div style={{ padding: "10px 16px" }}><BlockEmptyState icon="🗺️" label="Ajoutez une adresse ou un plan" sub={HIDDEN_WHEN_EMPTY_NOTE} muted={u.MUTED} /></div>
  return <Vue u={u} c={content} />
}
export function PublicEventAccess({ content, ctx }: PublicAdapterProps) {
  if (!acces(content)) return null
  return <Vue u={publicCtx(ctx)} c={content} />
}
