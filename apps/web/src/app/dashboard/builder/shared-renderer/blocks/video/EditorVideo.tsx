"use client"
import { videoBlockViewModel } from "../../models/videoBlock"
import { hasMeaningfulText } from "../../../blockEmptyState"
import { BlockEmptyState, HIDDEN_WHEN_EMPTY_NOTE } from "../../primitives/BlockEmptyState"
import type { EditorAdapterProps } from "../../renderTypes"

// Éditeur : placeholder legacy (aucune iframe/navigation au canvas). Fidèle au legacy.
export function EditorVideo({ content, ctx }: EditorAdapterProps) {
  // Lot v72 : sans url, la page publiée ne rend RIEN. L'éditeur le dit
  // au lieu de dessiner un bouton que le visiteur n'aura jamais.
  if (!hasMeaningfulText((content as any)?.url)) {
    return <div style={{ padding: "10px 16px", ...ctx.surfaceStyle }}><BlockEmptyState icon="🎬" label="Ajoutez le lien de la vidéo" sub={HIDDEN_WHEN_EMPTY_NOTE} muted={ctx.muted} /></div>
  }
  const { title } = videoBlockViewModel(content)
  const { text, surfaceStyle } = ctx
  return (
    <div style={{ padding: "10px 16px", ...surfaceStyle }}>
      <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "24px", textAlign: "center" }}>
        <span style={{ fontSize: 28 }}>▶️</span>
        <p style={{ color: text, fontSize: 13, margin: "8px 0 0", fontWeight: 600 }}>{title || "Vidéo"}</p>
      </div>
    </div>
  )
}
