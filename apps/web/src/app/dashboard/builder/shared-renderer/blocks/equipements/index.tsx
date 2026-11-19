"use client"
// equipements — les équipements du logement en icônes (livret d'accueil, 19 nov.).
// Une lecture : cochés dans une liste fermée, plus les « autres » saisis.
import { equipements } from "../../models/livretAccueil"
import { editorCtx, publicCtx, type UnifiedCtx, type EditorAdapterProps, type PublicAdapterProps } from "../../renderTypes"
import { BlockEmptyState, HIDDEN_WHEN_EMPTY_NOTE } from "../../primitives/BlockEmptyState"

function Vue({ c, u }: { c: Record<string, any>; u: UnifiedCtx }) {
  const liste = equipements(c)
  const s = (n: number) => Math.round(n * u.scale)
  return (
    <section data-equipements="" style={{ padding: `${s(12)}px 16px` }}>
      <h2 style={{ margin: `0 0 ${s(10)}px`, color: u.TEXT, fontSize: s(20), fontWeight: 800, fontFamily: u.FONT_D }}>{c.title || "Équipements"}</h2>
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: s(8) }}>
        {liste.map(e => (
          <li key={e.cle} style={{ display: "flex", alignItems: "center", gap: s(8), background: u.FILL, border: `1px solid ${u.LINE}`, borderRadius: 12, padding: `${s(10)}px ${s(12)}px`, color: u.TEXT, fontSize: s(14), fontWeight: 600, fontFamily: u.FONT_B }}>
            <span aria-hidden="true" style={{ fontSize: s(18) }}>{e.icone}</span>{e.libelle}
          </li>
        ))}
      </ul>
    </section>
  )
}

export function EditorEquipements({ content, ctx }: EditorAdapterProps) {
  const u = editorCtx(ctx)
  if (equipements(content).length === 0) return <div style={{ padding: "10px 16px" }}><BlockEmptyState icon="🛋️" label="Cochez les équipements du logement" sub={HIDDEN_WHEN_EMPTY_NOTE} muted={u.MUTED} /></div>
  return <Vue c={content} u={u} />
}
export function PublicEquipements({ content, ctx }: PublicAdapterProps) {
  const c = content || {}
  if (equipements(c).length === 0) return null
  return <Vue c={c} u={publicCtx(ctx)} />
}
