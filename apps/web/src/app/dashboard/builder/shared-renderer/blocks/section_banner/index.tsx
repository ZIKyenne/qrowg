"use client"
// section_banner — Le separateur de section. La couleur choisie ne s'appliquait
// qu'au TEXTE dans l'apercu : les filets et le degrade restaient a la couleur du
// theme. En ligne, tout prend la couleur choisie. Le commercant reglait un bleu
// et voyait des filets dores.
//
// L'apercu ecrivait aussi « SECTION » a la place du titre manquant — un mot de
// remplissage, dans les cinq styles.
import { separateur } from "../../models/structurePage"
import { BlockEmptyState, HIDDEN_WHEN_EMPTY_NOTE } from "../../primitives/BlockEmptyState"
import { sz, editorCtx, publicCtx, type UnifiedCtx, type EditorAdapterProps, type PublicAdapterProps } from "../../renderTypes"

function Vue({ u, c }: { u: UnifiedCtx; c: Record<string, any> }) {
  const s = separateur(c, u.G)!
  const col = s.couleur
  const filet = (sens: "gauche" | "droite") => (
    <div aria-hidden style={{ flex: 1, height: 1, background: sens === "gauche" ? `linear-gradient(90deg,transparent,${col}60)` : `linear-gradient(90deg,${col}60,transparent)` }} />
  )
  const points = <div aria-hidden style={{ display: "flex", gap: sz(u, 3) }}>{[0, 1, 2].map(i => <div key={i} style={{ width: sz(u, 4), height: sz(u, 4), borderRadius: "50%", background: col }} />)}</div>
  return (
    <div style={{ padding: `${sz(u, 12)}px ${sz(u, 24)}px`, fontFamily: u.FONT_B }}>
      {s.style === "lines" && <div style={{ display: "flex", alignItems: "center", gap: sz(u, 12) }}>{filet("gauche")}<span style={{ color: col, fontSize: sz(u, 13), fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", whiteSpace: "nowrap", fontFamily: u.FONT_B }}>{s.titre}</span>{filet("droite")}</div>}
      {s.style === "dots" && <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: sz(u, 9) }}>{points}<span style={{ color: col, fontSize: sz(u, 13), fontWeight: 700, letterSpacing: 3, fontFamily: u.FONT_B }}>{s.titre}</span>{points}</div>}
      {s.style === "gradient" && <div style={{ background: `linear-gradient(90deg,${col}15,${col}08)`, borderRadius: 9, padding: `${sz(u, 11)}px ${sz(u, 16)}px`, textAlign: "center" }}><span style={{ color: col, fontSize: sz(u, 14), fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", fontFamily: u.FONT_B }}>{s.titre}</span></div>}
      {s.style === "minimal" && <p style={{ color: col, fontSize: sz(u, 14), fontWeight: 700, letterSpacing: 4, textTransform: "uppercase", textAlign: "center", margin: 0, fontFamily: u.FONT_B }}>{s.titre}</p>}
      {s.style === "badge" && <div style={{ textAlign: "center" }}><span style={{ background: `${col}18`, border: `1px solid ${col}35`, borderRadius: 20, padding: `${sz(u, 7)}px ${sz(u, 19)}px`, color: col, fontSize: sz(u, 13), fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", fontFamily: u.FONT_B }}>{s.titre}</span></div>}
    </div>
  )
}

export function EditorSectionBanner({ content, ctx }: EditorAdapterProps) {
  const u = editorCtx(ctx)
  if (!separateur(content, u.G)) return <div style={{ padding: "10px 16px" }}><BlockEmptyState icon="〰️" label="Ajoutez le titre de la section" sub={HIDDEN_WHEN_EMPTY_NOTE} muted={u.MUTED} /></div>
  return <Vue u={u} c={content} />
}
export function PublicSectionBanner({ content, ctx }: PublicAdapterProps) {
  const u = publicCtx(ctx)
  if (!separateur(content, u.G)) return null
  return <Vue u={u} c={content} />
}
