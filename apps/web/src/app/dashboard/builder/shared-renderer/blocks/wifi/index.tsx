"use client"
// wifi — les deux adaptateurs. La vue (PublicWifi.tsx) vit dans la zone « page
// publiée » des gardes de vocabulaire, comme les autres blocs à contrôles.
import { wifiDuBloc } from "../../models/wifi"
import { editorCtx, publicCtx, type EditorAdapterProps, type PublicAdapterProps } from "../../renderTypes"
import { BlockEmptyState, HIDDEN_WHEN_EMPTY_NOTE } from "../../primitives/BlockEmptyState"
import { WifiVue } from "./PublicWifi"

export function EditorWifi({ content, ctx }: EditorAdapterProps) {
  const u = editorCtx(ctx)
  if (!wifiDuBloc(content)) return <div style={{ padding: "10px 16px" }}><BlockEmptyState icon="📶" label="Indiquez le nom de votre réseau" sub={HIDDEN_WHEN_EMPTY_NOTE} muted={u.MUTED} /></div>
  return <WifiVue content={content} u={u} />
}
export function PublicWifi({ content, ctx }: PublicAdapterProps) {
  const c = content || {}
  if (!wifiDuBloc(c)) return null
  return <WifiVue content={c} u={publicCtx(ctx)} />
}
