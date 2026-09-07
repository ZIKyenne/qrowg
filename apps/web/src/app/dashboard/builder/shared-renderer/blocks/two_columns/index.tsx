"use client"
// two_columns — Deux encadres cote a cote. Le seul de la famille dont l'apercu
// et la page etaient deja d'accord ; il rejoint la vue commune pour qu'ils le
// restent.
import { deuxColonnes } from "../../models/structurePage"
import { BlockEmptyState, HIDDEN_WHEN_EMPTY_NOTE } from "../../primitives/BlockEmptyState"
import { sz, editorCtx, publicCtx, type UnifiedCtx, type EditorAdapterProps, type PublicAdapterProps } from "../../renderTypes"

function Vue({ u, c }: { u: UnifiedCtx; c: Record<string, any> }) {
  const cols = deuxColonnes(c)
  return (
    <div style={{ padding: `${sz(u, 10)}px ${sz(u, 24)}px ${sz(u, 14)}px`, fontFamily: u.FONT_B }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: sz(u, 13) }}>
        {cols.map((col, i) => (
          <div key={i} style={{ background: `${u.G}0f`, border: `1px solid ${u.G}26`, borderRadius: 13, padding: `${sz(u, 14)}px ${sz(u, 13)}px` }}>
            {col.icone && <span aria-hidden style={{ fontSize: sz(u, 26), display: "block", marginBottom: sz(u, 9) }}>{col.icone}</span>}
            {col.titre && <p style={{ color: u.TEXT, fontSize: sz(u, 14), fontWeight: 700, margin: `0 0 ${sz(u, 5)}px`, fontFamily: u.FONT_B }}>{col.titre}</p>}
            {col.texte && <p style={{ color: u.MUTED, fontSize: sz(u, 12), margin: 0, lineHeight: 1.6, fontFamily: u.FONT_B }}>{col.texte}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}

export function EditorTwoColumns({ content, ctx }: EditorAdapterProps) {
  const u = editorCtx(ctx)
  if (deuxColonnes(content).length === 0) return <div style={{ padding: "10px 16px" }}><BlockEmptyState icon="🧱" label="Ajoutez le contenu des colonnes" sub={HIDDEN_WHEN_EMPTY_NOTE} muted={u.MUTED} /></div>
  return <Vue u={u} c={content} />
}
export function PublicTwoColumns({ content, ctx }: PublicAdapterProps) {
  if (deuxColonnes(content).length === 0) return null
  return <Vue u={publicCtx(ctx)} c={content} />
}
