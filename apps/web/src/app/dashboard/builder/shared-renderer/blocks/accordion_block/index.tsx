"use client"
// accordion_block — Des sections repliables : un titre, un texte qui se déplie.
// La première section est ouverte, des deux côtés — l'aperçu les montrait
// toutes fermées, la page ouvrait la première.
import { useId, useState } from "react"
import { sectionsAccordeon } from "../../models/structureEtActions"
import { TitreSection, pagePad } from "../../views/TitreSection"
import { BlockEmptyState, HIDDEN_WHEN_EMPTY_NOTE } from "../../primitives/BlockEmptyState"
import { sz, editorCtx, publicCtx, type UnifiedCtx, type EditorAdapterProps, type PublicAdapterProps } from "../../renderTypes"

function Vue({ u, c }: { u: UnifiedCtx; c: Record<string, any> }) {
  const sections = sectionsAccordeon(c)
  const [ouverte, setOuverte] = useState<number | null>(0)
  const base = useId()
  return (
    <div style={{ padding: pagePad(u), fontFamily: u.FONT_B }}>
      <TitreSection u={u} titre={String(c?.title || "").trim()} />
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: sz(u, 7) }}>
        {sections.map((s, i) => {
          const ici = ouverte === i
          return (
            <li key={i} style={{ border: `1px solid ${ici ? `${u.G}40` : u.LINE}`, borderRadius: sz(u, 11), overflow: "hidden" }}>
              <button type="button" onClick={() => setOuverte(ici ? null : i)} aria-expanded={ici} aria-controls={s.contenu ? `${base}-${i}` : undefined}
                style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", minHeight: 44, padding: `${sz(u, 13)}px ${sz(u, 15)}px`, background: ici ? `${u.G}08` : "transparent", border: "none", color: ici ? u.G : u.TEXT, fontSize: sz(u, 14), fontWeight: 600, cursor: "pointer", textAlign: "left", fontFamily: u.FONT_B }}>
                {s.titre}
                <span aria-hidden style={{ color: u.G, fontSize: sz(u, 18), lineHeight: 1, flexShrink: 0, marginLeft: sz(u, 10) }}>{ici ? "−" : "+"}</span>
              </button>
              {ici && s.contenu && (
                <div id={`${base}-${i}`} style={{ padding: `${sz(u, 4)}px ${sz(u, 15)}px ${sz(u, 14)}px`, background: u.FILL }}>
                  <p style={{ color: u.MUTED, fontSize: sz(u, 13), margin: 0, lineHeight: 1.6, whiteSpace: "pre-wrap", fontFamily: u.FONT_B }}>{s.contenu}</p>
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export function EditorAccordionBlock({ content, ctx }: EditorAdapterProps) {
  const u = editorCtx(ctx)
  if (sectionsAccordeon(content).length === 0) return <div style={{ padding: "10px 16px" }}><BlockEmptyState icon="➕" label="Ajoutez une section" sub={HIDDEN_WHEN_EMPTY_NOTE} muted={u.MUTED} /></div>
  return <Vue u={u} c={content} />
}
export function PublicAccordionBlock({ content, ctx }: PublicAdapterProps) {
  if (sectionsAccordeon(content).length === 0) return null
  return <Vue u={publicCtx(ctx)} c={content} />
}
