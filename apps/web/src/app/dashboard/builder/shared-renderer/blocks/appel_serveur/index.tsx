"use client"
// appel_serveur — les deux adaptateurs. La vue (PublicAppelServeur.tsx) vit dans
// la zone « page publiée » des gardes de vocabulaire, comme les autres blocs
// qui dessinent des contrôles aux couleurs du commerçant.
import { demandesActives } from "../../models/appelServeur"
import { editorCtx, publicCtx, type EditorAdapterProps, type PublicAdapterProps } from "../../renderTypes"
import { BlockEmptyState, HIDDEN_WHEN_EMPTY_NOTE } from "../../primitives/BlockEmptyState"
import { AppelServeurVue } from "./PublicAppelServeur"

export function EditorAppelServeur({ content, ctx }: EditorAdapterProps) {
  const u = editorCtx(ctx)
  if (demandesActives(content).length === 0) return <div style={{ padding: "10px 16px" }}><BlockEmptyState icon="🙋" label="Activez au moins une demande" sub={HIDDEN_WHEN_EMPTY_NOTE} muted={u.MUTED} /></div>
  return <AppelServeurVue content={content} u={u} pageId="" blockId="" />
}
export function PublicAppelServeur({ content, ctx }: PublicAdapterProps) {
  const c = content || {}
  if (demandesActives(c).length === 0) return null
  return <AppelServeurVue content={c} u={publicCtx(ctx)} pageId={ctx.pageId} blockId={ctx.blockId} />
}
