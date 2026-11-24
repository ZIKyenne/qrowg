"use client"
// multi_cta — Une grille de boutons (deux par ligne), chacun avec son icône.
// Un bouton sans destination n'existe pas — ni en ligne, ni dans l'aperçu, qui
// le dessinait jusqu'ici.
import { boutonsMultiples } from "../../models/structureEtActions"
import { SmartCta } from "../../primitives/LayoutSurface"
import { BlockEmptyState, HIDDEN_WHEN_EMPTY_NOTE } from "../../primitives/BlockEmptyState"
import { sz, editorCtx, publicCtx, type UnifiedCtx, type EditorAdapterProps, type PublicAdapterProps } from "../../renderTypes"

function Vue({ u, c }: { u: UnifiedCtx; c: Record<string, any> }) {
  return (
    <div style={{ padding: `${sz(u, 6)}px ${sz(u, 24)}px ${sz(u, 10)}px` }}>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gridTemplateColumns: "1fr 1fr", gap: sz(u, 8) }}>
        {boutonsMultiples(c).map((b, i) => (
          <li key={i} style={{ display: "flex" }}>
            <SmartCta u={u} href={b.href} external={b.externe} label={
              <>
                <span aria-hidden style={{ fontSize: sz(u, 22) }}>{b.icone}</span>
                <span style={{ color: u.TEXT, fontSize: sz(u, 12), fontWeight: 600, textAlign: "center", fontFamily: u.FONT_B }}>{b.label}</span>
              </>
            } style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: sz(u, 5), background: `${u.G}10`, border: `1px solid ${u.G}22`, borderRadius: sz(u, 12), padding: `${sz(u, 13)}px ${sz(u, 8)}px`, textDecoration: "none" }} />
          </li>
        ))}
      </ul>
    </div>
  )
}

export function EditorMultiCta({ content, ctx }: EditorAdapterProps) {
  const u = editorCtx(ctx)
  if (boutonsMultiples(content).length === 0) return <div style={{ padding: "10px 16px" }}><BlockEmptyState icon="🔘" label="Ajoutez un bouton et son lien" sub={HIDDEN_WHEN_EMPTY_NOTE} muted={u.MUTED} /></div>
  return <Vue u={u} c={content} />
}
export function PublicMultiCta({ content, ctx }: PublicAdapterProps) {
  if (boutonsMultiples(content).length === 0) return null
  return <Vue u={publicCtx(ctx)} c={content} />
}
