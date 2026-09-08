"use client"
import { skillsViewModel } from "../../models/skills"
import { BlockEmptyState, HIDDEN_WHEN_EMPTY_NOTE } from "../../primitives/BlockEmptyState"
import type { EditorAdapterProps } from "../../renderTypes"

export function EditorSkills({ content, ctx }: EditorAdapterProps) {
  const { visible, title, tags } = skillsViewModel(content)
  const { primary, muted, surfaceStyle } = ctx
  // La page ne publie plus le décor d'un bloc vide ; l'aperçu le dit, plutôt que
  // de laisser un cadre muet dans le canvas. (Vague 25.)
  if (!visible) return (
    <div style={{ padding: "10px 16px", ...surfaceStyle }}>
      <BlockEmptyState icon="🏷️" label="Ajoutez vos compétences" sub={HIDDEN_WHEN_EMPTY_NOTE} muted={muted} />
    </div>
  )
  return (
    <div style={{ padding: "12px 16px", ...surfaceStyle }}>
      {title && <p style={{ color: muted, fontSize: 10, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 8px" }}>{title}</p>}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
        {tags.map((tag, i) => <span key={i} style={{ background: primary + "12", border: `1px solid ${primary}30`, borderRadius: 20, padding: "3px 10px", fontSize: 11, color: primary, fontWeight: 600 }}>{tag}</span>)}
      </div>
    </div>
  )
}
