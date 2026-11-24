"use client"
// documents — Menus, brochures, tarifs, CGV à consulter ou télécharger.
// « Télécharger ↓ » n'apparaît que si le document a un fichier : l'aperçu
// l'affichait sur tous, la page seulement sur ceux qui mènent quelque part.
import { documentsListe, type Document } from "../../models/structureEtActions"
import { TitreSection, pagePad } from "../../views/TitreSection"
import { BlockEmptyState, HIDDEN_WHEN_EMPTY_NOTE } from "../../primitives/BlockEmptyState"
import { sz, editorCtx, publicCtx, type UnifiedCtx, type EditorAdapterProps, type PublicAdapterProps } from "../../renderTypes"

function Ligne({ u, d }: { u: UnifiedCtx; d: Document }) {
  const corps = (
    <>
      <div aria-hidden style={{ width: sz(u, 42), height: sz(u, 42), borderRadius: sz(u, 10), background: `${d.couleur}14`, border: `1px solid ${d.couleur}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: sz(u, 20), flexShrink: 0 }}>{d.icone}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ color: u.TEXT, fontSize: sz(u, 13.5), fontWeight: 700, margin: `0 0 ${sz(u, 1)}px`, fontFamily: u.FONT_B, overflowWrap: "anywhere" }}>{d.nom}</p>
        {d.desc && <p style={{ color: u.MUTED, fontSize: sz(u, 13.5), margin: 0, lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.desc}</p>}
        {d.meta && <p style={{ color: u.MUTED, fontSize: sz(u, 12.5), margin: `${sz(u, 3)}px 0 0`, opacity: 0.8 }}>{d.type ? `${d.type} · ` : ""}{d.meta}</p>}
      </div>
      {d.href && <span style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 5, color: u.G, fontSize: sz(u, 12), fontWeight: 700 }}>{d.action} <span aria-hidden>↓</span></span>}
    </>
  )
  const st = { display: "flex", alignItems: "center", gap: sz(u, 12), background: u.FILL, border: `1px solid ${u.LINE}`, borderRadius: sz(u, 12), padding: `${sz(u, 11)}px ${sz(u, 13)}px`, textDecoration: "none" } as const
  if (u.mode === "public" && d.href) {
    const href = d.href
    return <a href={href} target="_blank" rel="noopener noreferrer" onClick={() => { try { u.trackClick(href) } catch {} }} style={st}>{corps}</a>
  }
  return <div style={st}>{corps}</div>
}

function Vue({ u, c, docs }: { u: UnifiedCtx; c: Record<string, any>; docs: Document[] }) {
  return (
    <div style={{ padding: pagePad(u), fontFamily: u.FONT_B }}>
      <TitreSection u={u} titre={String(c?.title || "").trim()} marge={12} />
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: sz(u, 8) }}>
        {docs.map((d, i) => <li key={i}><Ligne u={u} d={d} /></li>)}
      </ul>
    </div>
  )
}

export function EditorDocuments({ content, ctx }: EditorAdapterProps) {
  const u = editorCtx(ctx)
  const docs = documentsListe(content)
  if (docs.length === 0) return <div style={{ padding: "10px 16px" }}><BlockEmptyState icon="📄" label="Ajoutez un document" sub={HIDDEN_WHEN_EMPTY_NOTE} muted={u.MUTED} /></div>
  return <Vue u={u} c={content} docs={docs} />
}
export function PublicDocuments({ content, ctx }: PublicAdapterProps) {
  const docs = documentsListe(content)
  if (docs.length === 0) return null
  return <Vue u={publicCtx(ctx)} c={content} docs={docs} />
}
