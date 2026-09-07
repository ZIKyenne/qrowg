"use client"
// music_links — Les liens d'ecoute. Le bloc publiait jusqu'a CINQ liens et n'en
// tracait AUCUN : tous les autres blocs a lien remontent le clic, celui-ci
// n'avait simplement pas de `onClick`. L'artiste voyait donc zero statistique
// sur le bloc dont c'est tout l'objet, et pouvait en conclure que personne ne
// cliquait. Il passe par le meme chemin que les autres.
import { liensMusique } from "../../models/musique"
import { avecCibleTactile } from "../../primitives/BlockCtaLink"
import { BlockEmptyState, HIDDEN_WHEN_EMPTY_NOTE } from "../../primitives/BlockEmptyState"
import { sz, editorCtx, publicCtx, type UnifiedCtx, type EditorAdapterProps, type PublicAdapterProps } from "../../renderTypes"
import { ExternalLink } from "lucide-react"

function Vue({ u, c }: { u: UnifiedCtx; c: Record<string, any> }) {
  const m = liensMusique(c)!
  return (
    <div style={{ padding: `${sz(u, 6)}px ${sz(u, 24)}px ${sz(u, 16)}px`, fontFamily: u.FONT_B }}>
      {m.artiste && <p style={{ color: u.TEXT, fontSize: sz(u, 15), fontWeight: 700, margin: `0 0 ${sz(u, 12)}px`, textAlign: "center", fontFamily: u.FONT_D }}>{m.artiste}</p>}
      <div style={{ display: "flex", flexDirection: "column", gap: sz(u, 8) }}>
        {m.plateformes.map(p => {
          const style = avecCibleTactile({
            gap: sz(u, 13), background: `${p.couleur}10`, border: `1px solid ${p.couleur}22`,
            borderRadius: 12, padding: `${sz(u, 12)}px ${sz(u, 15)}px`, textDecoration: "none",
            justifyContent: "flex-start", width: "100%",
          })
          const dedans = (
            <>
              <span aria-hidden style={{ fontSize: sz(u, 20) }}>{p.icone}</span>
              <span style={{ color: u.TEXT, fontSize: sz(u, 14), fontWeight: 600, flex: 1, fontFamily: u.FONT_B }}>{p.label}</span>
              <ExternalLink size={sz(u, 13)} color={p.couleur} style={{ opacity: 0.7, flexShrink: 0 }} />
            </>
          )
          return u.mode === "public"
            ? <a key={p.cle} href={p.href} target="_blank" rel="noopener noreferrer" onClick={() => u.trackClick(p.href)} style={style}>{dedans}</a>
            : <div key={p.cle} aria-disabled="true" style={style}>{dedans}</div>
        })}
      </div>
    </div>
  )
}

export function EditorMusicLinks({ content, ctx }: EditorAdapterProps) {
  const u = editorCtx(ctx)
  if (!liensMusique(content)) return <div style={{ padding: "10px 16px" }}><BlockEmptyState icon="🎵" label="Ajoutez au moins un lien d’écoute" sub={HIDDEN_WHEN_EMPTY_NOTE} muted={u.MUTED} /></div>
  return <Vue u={u} c={content} />
}
export function PublicMusicLinks({ content, ctx }: PublicAdapterProps) {
  if (!liensMusique(content)) return null
  return <Vue u={publicCtx(ctx)} c={content} />
}
