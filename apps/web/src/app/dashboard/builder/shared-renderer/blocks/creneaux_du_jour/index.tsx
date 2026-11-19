"use client"
// creneaux_du_jour — les deux adaptateurs (beauté, 19 nov.).
import { editorCtx, publicCtx, type EditorAdapterProps, type PublicAdapterProps } from "../../renderTypes"
import { BlockEmptyState, HIDDEN_WHEN_EMPTY_NOTE } from "../../primitives/BlockEmptyState"
import { CreneauxVue, CreneauxEnLigne, tousLesCreneaux } from "./PublicCreneauxDuJour"

export function EditorCreneauxDuJour({ content, ctx }: EditorAdapterProps) {
  const u = editorCtx(ctx)
  const tous = tousLesCreneaux(content)
  if (tous.length === 0) return <div style={{ padding: "10px 16px" }}><BlockEmptyState icon="🕑" label="Indiquez vos créneaux libres du jour" sub={HIDDEN_WHEN_EMPTY_NOTE} muted={u.MUTED} /></div>
  return <CreneauxVue content={content} u={u} creneaux={tous} />
}
export function PublicCreneauxDuJour({ content, ctx }: PublicAdapterProps) {
  return <CreneauxEnLigne content={content || {}} u={publicCtx(ctx)} />
}
