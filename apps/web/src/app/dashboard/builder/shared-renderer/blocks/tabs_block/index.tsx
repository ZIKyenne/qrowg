"use client"
// tabs_block — Des onglets : un libellé par onglet, un texte par onglet.
// L'aperçu écrivait « Ajoutez du contenu... » dans un onglet vide ; un onglet
// vide reste vide, des deux côtés. Les onglets suivent le motif ARIA (tablist,
// tab relié à son tabpanel) et les flèches du clavier passent d'un onglet à
// l'autre.
import { useId, useState, type KeyboardEvent } from "react"
import { onglets } from "../../models/structureEtActions"
import { pagePad } from "../../views/TitreSection"
import { BlockEmptyState, HIDDEN_WHEN_EMPTY_NOTE } from "../../primitives/BlockEmptyState"
import { sz, editorCtx, publicCtx, type UnifiedCtx, type EditorAdapterProps, type PublicAdapterProps } from "../../renderTypes"

function Vue({ u, c }: { u: UnifiedCtx; c: Record<string, any> }) {
  const tabs = onglets(c)
  const [actif, setActif] = useState(0)
  const base = useId()
  const i = Math.min(actif, tabs.length - 1)
  const auClavier = (e: KeyboardEvent<HTMLButtonElement>) => {
    const pas = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0
    if (!pas) return
    e.preventDefault()
    const n = (i + pas + tabs.length) % tabs.length
    setActif(n)
    document.getElementById(`${base}-t${n}`)?.focus()
  }
  return (
    <div style={{ padding: pagePad(u), fontFamily: u.FONT_B }}>
      <div role="tablist" style={{ display: "flex", borderBottom: `1px solid ${u.LINE}`, marginBottom: sz(u, 13), overflowX: "auto" }}>
        {tabs.map((t, k) => (
          <button key={k} id={`${base}-t${k}`} type="button" role="tab" aria-selected={i === k} aria-controls={`${base}-p`} tabIndex={i === k ? 0 : -1}
            onClick={() => setActif(k)} onKeyDown={auClavier}
            style={{ padding: `${sz(u, 9)}px ${sz(u, 15)}px`, minHeight: 44, background: "transparent", border: "none", borderBottom: `2px solid ${i === k ? u.G : "transparent"}`, color: i === k ? u.G : u.MUTED, fontSize: sz(u, 13), fontWeight: i === k ? 700 : 400, cursor: "pointer", whiteSpace: "nowrap", fontFamily: u.FONT_B }}>{t.label}</button>
        ))}
      </div>
      <p id={`${base}-p`} role="tabpanel" aria-labelledby={`${base}-t${i}`} style={{ color: u.TEXT, fontSize: sz(u, 14), margin: 0, lineHeight: 1.7, whiteSpace: "pre-wrap", fontFamily: u.FONT_B }}>{tabs[i]?.contenu}</p>
    </div>
  )
}

export function EditorTabsBlock({ content, ctx }: EditorAdapterProps) {
  const u = editorCtx(ctx)
  if (onglets(content).length === 0) return <div style={{ padding: "10px 16px" }}><BlockEmptyState icon="🗂️" label="Ajoutez un onglet" sub={HIDDEN_WHEN_EMPTY_NOTE} muted={u.MUTED} /></div>
  return <Vue u={u} c={content} />
}
export function PublicTabsBlock({ content, ctx }: PublicAdapterProps) {
  if (onglets(content).length === 0) return null
  return <Vue u={publicCtx(ctx)} c={content} />
}
