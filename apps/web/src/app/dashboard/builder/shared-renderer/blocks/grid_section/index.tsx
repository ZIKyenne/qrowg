"use client"
// grid_section — Une grille de cartes. L'apercu coupait la liste a
// `colonnes x 2` cartes : a deux colonnes, les cartes 5 et 6 etaient donc
// invisibles pour l'auteur alors que la page les publie. Un plafond que la page
// n'a jamais eu.
import { grille } from "../../models/structurePage"
import { BlockEmptyState, HIDDEN_WHEN_EMPTY_NOTE } from "../../primitives/BlockEmptyState"
import { sz, editorCtx, publicCtx, type UnifiedCtx, type EditorAdapterProps, type PublicAdapterProps } from "../../renderTypes"

function Vue({ u, c }: { u: UnifiedCtx; c: Record<string, any> }) {
  const g = grille(c)!
  return (
    <div style={{ padding: `${sz(u, 10)}px ${sz(u, 24)}px ${sz(u, 14)}px`, fontFamily: u.FONT_B }}>
      {g.titre && <p style={{ color: u.MUTED, fontSize: sz(u, 11), textTransform: "uppercase", letterSpacing: 2, margin: `0 0 ${sz(u, 12)}px`, fontFamily: u.FONT_B }}>{g.titre}</p>}
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${g.colonnes},1fr)`, gap: sz(u, 9) }}>
        {g.cartes.map((k, i) => (
          <div key={i} style={{ background: u.FILL, border: `1px solid ${u.LINE}`, borderRadius: 11, padding: `${sz(u, 13)}px ${sz(u, 10)}px`, textAlign: "center" }}>
            {k.icone && <span aria-hidden style={{ fontSize: sz(u, 24), display: "block", marginBottom: sz(u, 7) }}>{k.icone}</span>}
            <p style={{ color: u.TEXT, fontSize: sz(u, 12), fontWeight: 700, margin: `0 0 ${sz(u, 3)}px`, fontFamily: u.FONT_B }}>{k.titre}</p>
            {k.texte && <p style={{ color: u.MUTED, fontSize: sz(u, 11), margin: 0, fontFamily: u.FONT_B }}>{k.texte}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}

export function EditorGridSection({ content, ctx }: EditorAdapterProps) {
  const u = editorCtx(ctx)
  if (!grille(content)) return <div style={{ padding: "10px 16px" }}><BlockEmptyState icon="▦" label="Ajoutez une carte" sub={HIDDEN_WHEN_EMPTY_NOTE} muted={u.MUTED} /></div>
  return <Vue u={u} c={content} />
}
export function PublicGridSection({ content, ctx }: PublicAdapterProps) {
  if (!grille(content)) return null
  return <Vue u={publicCtx(ctx)} c={content} />
}
