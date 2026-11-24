"use client"
// sticky_bar — La barre d'actions fixée en bas (ou en haut) de l'écran du
// téléphone : appeler, WhatsApp, itinéraire, réserver, partager…
//
// Sur la page publiée, elle est FIXE et réserve sa hauteur dans le flux. Dans
// le canvas de l'éditeur, une barre fixe recouvrirait l'éditeur lui-même :
// l'aperçu la dessine à sa place dans la page, sous une légende qui dit où elle
// s'affichera. Les actions, elles, sont les mêmes des deux côtés — le modèle
// décide, et la clé de suivi historique (`bar:<type>`) est conservée.
import { actionsDeBarre, type ActionDeBarre } from "../../models/structureEtActions"
import { BoutonPartager } from "../../primitives/BoutonPartager"
import { BlockEmptyState, HIDDEN_WHEN_EMPTY_NOTE } from "../../primitives/BlockEmptyState"
import { sz, editorCtx, publicCtx, type UnifiedCtx, type EditorAdapterProps, type PublicAdapterProps } from "../../renderTypes"

function fondDeBarre(c: Record<string, any>, G: string): string {
  return c.bar_style === "solid" ? "#0A0A0A" : c.bar_style === "gold" ? `linear-gradient(90deg,${G},${G}dd)` : "rgba(12,12,12,0.82)"
}

function Action({ u, a, c }: { u: UnifiedCtx; a: ActionDeBarre; c: Record<string, any> }) {
  const couleur = c.bar_style === "gold" ? "#080808" : a.couleur
  const contenu = (
    <span style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: sz(u, 3) }}>
      <span aria-hidden style={{ fontSize: sz(u, 20) }}>{a.icone}</span>
      {c.show_labels !== "no"
        ? <span style={{ color: couleur, fontSize: sz(u, 11), fontWeight: 700 }}>{a.label}</span>
        // Libellés masqués : l'icône seule ne dit rien à un lecteur d'écran.
        : <span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>{a.label}</span>}
    </span>
  )
  const st = { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: `${sz(u, 6)}px ${sz(u, 4)}px`, textDecoration: "none", background: "transparent", border: "none", cursor: "pointer", minHeight: 44 } as const
  if (u.mode === "editor") return <div style={st}>{contenu}</div>
  if (a.partage) return <BoutonPartager u={u} style={st} contenu={contenu} barreEnHaut={c.position === "top"} />
  return <a href={a.href!} target={a.externe ? "_blank" : undefined} rel="noopener noreferrer" onClick={() => { try { u.trackClick(`bar:${a.type}`) } catch {} }} style={st}>{contenu}</a>
}

export function EditorStickyBar({ content, ctx }: EditorAdapterProps) {
  const u = editorCtx(ctx)
  const actions = actionsDeBarre(content)
  if (actions.length === 0) return <div style={{ padding: "10px 16px" }}><BlockEmptyState icon="📌" label="Choisissez une action et sa destination" sub={HIDDEN_WHEN_EMPTY_NOTE} muted={u.MUTED} /></div>
  return (
    <div style={{ padding: "8px 16px" }}>
      <div style={{ border: `1px dashed ${u.G}4d`, borderRadius: 12, padding: "8px 10px", background: `${u.G}0a` }}>
        <p style={{ color: u.MUTED, fontSize: sz(u, 11), margin: "0 0 7px", textTransform: "uppercase", letterSpacing: 1 }}>📌 Barre fixe · {content.position === "top" ? "haut" : "bas"} de l&apos;écran (mobile)</p>
        <ul style={{ listStyle: "none", margin: 0, display: "flex", justifyContent: "space-around", alignItems: "stretch", background: fondDeBarre(content, u.G), borderRadius: 12, padding: "4px 6px" }}>
          {actions.map((a, i) => <li key={i} style={{ flex: 1, display: "flex" }}><Action u={u} a={a} c={content} /></li>)}
        </ul>
      </div>
    </div>
  )
}

export function PublicStickyBar({ content: c, ctx }: PublicAdapterProps) {
  const actions = actionsDeBarre(c)
  if (actions.length === 0) return null
  const u = publicCtx(ctx)
  const enHaut = c.position === "top"
  return (
    <>
      <div style={{ height: 68 }} aria-hidden />
      <nav aria-label="Actions rapides" style={{ position: "fixed", ...(enHaut ? { top: 0 } : { bottom: 0 }), left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, zIndex: 60, background: fondDeBarre(c, u.G), backdropFilter: c.bar_style === "blur" ? "blur(14px)" : undefined, WebkitBackdropFilter: c.bar_style === "blur" ? "blur(14px)" : undefined, borderTop: enHaut ? "none" : "1px solid rgba(255,255,255,0.1)", borderBottom: enHaut ? "1px solid rgba(255,255,255,0.1)" : "none", boxShadow: enHaut ? "0 8px 24px rgba(0,0,0,0.4)" : "0 -8px 24px rgba(0,0,0,0.4)", padding: `8px 6px calc(8px + env(safe-area-inset-bottom))` }}>
        <ul style={{ listStyle: "none", padding: 0, margin: 0, flex: 1, display: "flex", justifyContent: "space-around", alignItems: "stretch" }}>
          {actions.map((a, i) => <li key={i} style={{ flex: 1, display: "flex" }}><Action u={u} a={a} c={c} /></li>)}
        </ul>
      </nav>
    </>
  )
}
