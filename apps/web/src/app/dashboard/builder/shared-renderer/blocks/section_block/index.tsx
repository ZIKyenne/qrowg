"use client"
// section_block — Un en-tete de section : titre, sous-titre, filet. Sans style
// de fond choisi, l'apercu appliquait quand meme 14 px de marge interieure la ou
// la page n'en met aucune — le bloc paraissait plus aere qu'il ne le serait.
import { enTeteSection } from "../../models/structurePage"
import { BlockEmptyState, HIDDEN_WHEN_EMPTY_NOTE } from "../../primitives/BlockEmptyState"
import { sz, editorCtx, publicCtx, type UnifiedCtx, type EditorAdapterProps, type PublicAdapterProps } from "../../renderTypes"

function Vue({ u, c }: { u: UnifiedCtx; c: Record<string, any> }) {
  const e = enTeteSection(c)!
  const encadre = e.fond !== "transparent"
  return (
    <div style={{ padding: `${sz(u, 10)}px ${sz(u, 24)}px`, fontFamily: u.FONT_B }}>
      <div style={{
        background: e.fond === "card" ? u.FILL : e.fond === "highlight" ? `${u.G}14` : "transparent",
        border: e.fond === "card" ? `1px solid ${u.LINE}` : e.fond === "highlight" ? `1px solid ${u.G}33` : "none",
        borderRadius: encadre ? 13 : 0, padding: encadre ? sz(u, 15) : 0,
      }}>
        {e.titre && <p style={{ color: u.G, fontSize: sz(u, 16), fontWeight: 700, margin: `0 0 ${sz(u, 3)}px`, fontFamily: u.FONT_D }}>{e.titre}</p>}
        {e.sousTitre && <p style={{ color: u.MUTED, fontSize: sz(u, 13), margin: e.filet ? `0 0 ${sz(u, 11)}px` : 0, fontFamily: u.FONT_B }}>{e.sousTitre}</p>}
        {e.filet && <div aria-hidden style={{ height: 1, background: `linear-gradient(90deg,${u.G}50,transparent)`, marginTop: e.titre && !e.sousTitre ? sz(u, 8) : 0 }} />}
      </div>
    </div>
  )
}

export function EditorSectionBlock({ content, ctx }: EditorAdapterProps) {
  const u = editorCtx(ctx)
  if (!enTeteSection(content)) return <div style={{ padding: "10px 16px" }}><BlockEmptyState icon="🏷️" label="Ajoutez le titre de la section" sub={HIDDEN_WHEN_EMPTY_NOTE} muted={u.MUTED} /></div>
  return <Vue u={u} c={content} />
}
export function PublicSectionBlock({ content, ctx }: PublicAdapterProps) {
  if (!enTeteSection(content)) return null
  return <Vue u={publicCtx(ctx)} c={content} />
}
