"use client"
import { beforeAfterViewModel } from "../../models/beforeAfter"
import { BlockEmptyState, HIDDEN_WHEN_EMPTY_NOTE } from "../../primitives/BlockEmptyState"
import type { EditorAdapterProps } from "../../renderTypes"
import SmartImage from "@/components/SmartImage"

export function EditorBeforeAfter({ content, ctx }: EditorAdapterProps) {
  const { visible, title, description, beforeImg, afterImg, beforeLabel, afterLabel } = beforeAfterViewModel(content)
  const { text, muted, surfaceStyle } = ctx
  // Lot v166 : ce bloc disparaît de la page quand il est vide, et l'éditeur
  // ne le disait pas — le commerçant le croyait publié.
  if (!visible) return <div style={{ padding: "10px 16px", ...surfaceStyle }}><BlockEmptyState icon="🔀" label="Ajoutez la photo avant et la photo après" sub={HIDDEN_WHEN_EMPTY_NOTE} muted={muted} /></div>
  return (
    <div style={{ padding: "10px 16px", ...surfaceStyle }}>
      {title && <p style={{ color: text, fontSize: 13, fontWeight: 700, margin: "0 0 10px", textAlign: "center" }}>{title}</p>}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <div style={{ borderRadius: 10, overflow: "hidden" }}>
          {beforeImg ? <SmartImage src={beforeImg} alt="Avant" width={280} height={120} sizes="(max-width: 640px) 50vw, 280px" style={{ width: "100%", height: 120, objectFit: "cover", display: "block" }} /> : <div style={{ height: 120, background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>📸</div>}
          <div style={{ background: "rgba(239,68,68,0.15)", padding: "5px", textAlign: "center" }}><p style={{ color: "#EF4444", fontSize: 11, fontWeight: 700, margin: 0 }}>{beforeLabel}</p></div>
        </div>
        <div style={{ borderRadius: 10, overflow: "hidden" }}>
          {afterImg ? <SmartImage src={afterImg} alt="Après" width={280} height={120} sizes="(max-width: 640px) 50vw, 280px" style={{ width: "100%", height: 120, objectFit: "cover", display: "block" }} /> : <div style={{ height: 120, background: "rgba(57,255,143,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>✨</div>}
          <div style={{ background: "rgba(57,255,143,0.15)", padding: "5px", textAlign: "center" }}><p style={{ color: "var(--success)", fontSize: 11, fontWeight: 700, margin: 0 }}>{afterLabel}</p></div>
        </div>
      </div>
      {description && <p style={{ color: muted, fontSize: 12.5, textAlign: "center", margin: "8px 0 0" }}>{description}</p>}
    </div>
  )
}
