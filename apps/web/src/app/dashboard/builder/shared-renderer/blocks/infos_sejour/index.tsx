"use client"
// infos_sejour — les deux adaptateurs (livret d'accueil, 19 nov.).
import { infosSejour } from "../../models/livretAccueil"
import { editorCtx, publicCtx, type EditorAdapterProps, type PublicAdapterProps } from "../../renderTypes"
import { BlockEmptyState, HIDDEN_WHEN_EMPTY_NOTE } from "../../primitives/BlockEmptyState"
import { InfosSejourVue } from "./PublicInfosSejour"

export function EditorInfosSejour({ content, ctx }: EditorAdapterProps) {
  const u = editorCtx(ctx)
  if (!infosSejour(content)) return <div style={{ padding: "10px 16px" }}><BlockEmptyState icon="🔑" label="Indiquez l'arrivée, le départ et l'accès" sub={HIDDEN_WHEN_EMPTY_NOTE} muted={u.MUTED} /></div>
  return <InfosSejourVue content={content} u={u} />
}
export function PublicInfosSejour({ content, ctx }: PublicAdapterProps) {
  const c = content || {}
  if (!infosSejour(c)) return null
  return <InfosSejourVue content={c} u={publicCtx(ctx)} />
}
