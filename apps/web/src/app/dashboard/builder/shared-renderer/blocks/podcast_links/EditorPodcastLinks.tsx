"use client"
import { ExternalLink } from "lucide-react"
import { BlockEmptyState, HIDDEN_WHEN_EMPTY_NOTE } from "../../primitives/BlockEmptyState"
import { podcastLinksViewModel } from "../../models/podcastLinks"
import { EditorSharedImage } from "../../primitives/EditorImage"
import type { EditorAdapterProps } from "../../renderTypes"

export function EditorPodcastLinks({ content, ctx }: EditorAdapterProps) {
  const { visible, cover, name, description, platforms } = podcastLinksViewModel(content)
  const { text, muted, surfaceStyle } = ctx
  // Lot v152 : sans garde, l’aperçu écrivait « Nommez le podcast » à la
  // place du commerçant, pour un bloc que la page ne publie pas.
  if (!visible) return <div style={{ padding: "10px 16px", ...ctx.surfaceStyle }}><BlockEmptyState icon="🎙️" label="Nommez le podcast ou ajoutez une plateforme" sub={HIDDEN_WHEN_EMPTY_NOTE} muted={ctx.muted} /></div>
  return (
    <div style={{ padding: "10px 16px", ...surfaceStyle }}>
      <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 12 }}>
        {cover.src
          ? <EditorSharedImage model={cover} width={52} height={52} sizes="52px" style={{ width: 52, height: 52, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />
          : <div style={{ width: 52, height: 52, borderRadius: 10, background: "rgba(177,80,226,0.15)", border: "1px solid rgba(177,80,226,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0 }}>🎙️</div>}
        <div>
          <p style={{ color: text, fontSize: 14, fontWeight: 700, margin: "0 0 2px" }}>{name}</p>
          {description && <p style={{ color: muted, fontSize: 12.5, margin: 0 }}>{description}</p>}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {platforms.length === 0
          ? <p style={{ color: muted, fontSize: 11, textAlign: "center", margin: 0 }}>Ajoutez vos plateformes d'écoute</p>
          : platforms.map((p, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, background: `${p.color}12`, border: `1px solid ${p.color}25`, borderRadius: 9, padding: "9px 12px" }}>
              <span style={{ fontSize: 16 }}>{p.icon}</span>
              <span style={{ color: text, fontSize: 12, fontWeight: 600, flex: 1 }}>{p.label}</span>
              <ExternalLink size={11} color={p.color} />
            </div>
          ))}
      </div>
    </div>
  )
}
