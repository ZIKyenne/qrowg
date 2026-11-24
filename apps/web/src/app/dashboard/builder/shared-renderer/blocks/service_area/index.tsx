"use client"
// service_area — La zone où le professionnel intervient : une zone, un rayon,
// jusqu'à six villes. Une ville seule suffit à publier le bloc.
import { zoneDesservie } from "../../models/affichagesSimples"
import { TitreSection, pagePad } from "../../views/TitreSection"
import { BlockEmptyState, HIDDEN_WHEN_EMPTY_NOTE } from "../../primitives/BlockEmptyState"
import { sz, editorCtx, publicCtx, type UnifiedCtx, type EditorAdapterProps, type PublicAdapterProps } from "../../renderTypes"

const TEINTE = "rgba(66,133,244,0.08)"
const FILET = "1px solid rgba(66,133,244,0.2)"

function Vue({ u, m }: { u: UnifiedCtx; m: NonNullable<ReturnType<typeof zoneDesservie>> }) {
  return (
    <div style={{ padding: pagePad(u), fontFamily: u.FONT_B }}>
      <TitreSection u={u} titre={m.titre} />
      {m.zone && (
        <div style={{ display: "flex", alignItems: "center", gap: sz(u, 11), background: TEINTE, border: FILET, borderRadius: sz(u, 11), padding: `${sz(u, 12)}px ${sz(u, 15)}px`, marginBottom: m.villes.length > 0 ? sz(u, 11) : 0 }}>
          <span aria-hidden style={{ fontSize: sz(u, 21) }}>📍</span>
          <div>
            <p style={{ color: u.TEXT, fontSize: sz(u, 14), fontWeight: 700, margin: `0 0 ${sz(u, 2)}px`, fontFamily: u.FONT_B }}>{m.zone}</p>
            {m.rayon && <p style={{ color: u.MUTED, fontSize: sz(u, 12), margin: 0 }}>{m.rayon}</p>}
          </div>
        </div>
      )}
      {m.villes.length > 0 && (
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexWrap: "wrap", gap: sz(u, 8) }}>
          {m.villes.map((v, i) => <li key={i} style={{ background: TEINTE, border: FILET, borderRadius: 20, padding: `${sz(u, 6)}px ${sz(u, 13)}px`, color: u.TEXT, fontSize: sz(u, 13) }}><span aria-hidden>📍 </span>{v}</li>)}
        </ul>
      )}
      {m.note && <p style={{ color: u.MUTED, fontSize: sz(u, 13.5), margin: `${sz(u, 11)}px 0 0`, fontStyle: "italic" }}>{m.note}</p>}
    </div>
  )
}

export function EditorServiceArea({ content, ctx }: EditorAdapterProps) {
  const u = editorCtx(ctx)
  const m = zoneDesservie(content)
  if (!m) return <div style={{ padding: "10px 16px" }}><BlockEmptyState icon="📍" label="Nommez votre zone ou une ville" sub={HIDDEN_WHEN_EMPTY_NOTE} muted={u.MUTED} /></div>
  return <Vue u={u} m={m} />
}
export function PublicServiceArea({ content, ctx }: PublicAdapterProps) {
  const m = zoneDesservie(content)
  if (!m) return null
  return <Vue u={publicCtx(ctx)} m={m} />
}
