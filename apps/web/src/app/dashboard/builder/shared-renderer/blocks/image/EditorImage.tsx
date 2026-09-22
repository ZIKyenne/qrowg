"use client"
import { imageViewModel } from "../../models/image"
import { BlockEmptyState, HIDDEN_WHEN_EMPTY_NOTE } from "../../primitives/BlockEmptyState"
import type { EditorAdapterProps } from "../../renderTypes"
import SmartImage from "@/components/SmartImage"

// Éditeur : aucun lien (neutralisé) ; placeholder « Aucune image » si pas de média.
export function EditorImage({ content, ctx }: EditorAdapterProps) {
  const { hasMedia, src, alt, caption, isCircle, rounded, aspectRatio } = imageViewModel(content)
  const { muted, surfaceStyle } = ctx
  // Lot v166 : l'invite existait déjà, et elle arrivait AVANT tout le reste —
  // elle gagnait donc toujours. Mais elle disait « Aucune image » sans dire
  // l'essentiel : le bloc ne sera pas publié tant qu'il n'y en a pas. C'est
  // maintenant l'état vide du produit, avec sa phrase, et une vraie note.
  if (!hasMedia) return (
    <div style={{ padding: "10px 16px", ...surfaceStyle }}>
      <BlockEmptyState icon="🖼️" label="Ajoutez une image" sub={HIDDEN_WHEN_EMPTY_NOTE} muted={muted} />
    </div>
  )
  const img = <SmartImage src={src!} alt={alt} width={560} height={220} sizes="(max-width: 640px) 100vw, 560px" style={{ width: "100%", height: aspectRatio ? "auto" : undefined, maxHeight: aspectRatio ? undefined : 220, aspectRatio, objectFit: "cover", display: "block", borderRadius: isCircle ? "50%" : rounded === "rounded" ? 10 : 0 }} />
  return (
    <div style={{ ...surfaceStyle }}>
      <div>
        {isCircle ? <div style={{ maxWidth: 170, margin: "0 auto" }}>{img}</div> : img}
        {caption && <p style={{ color: muted, fontSize: 10, textAlign: "center", margin: "6px 14px" }}>{caption}</p>}
      </div>
    </div>
  )
}
