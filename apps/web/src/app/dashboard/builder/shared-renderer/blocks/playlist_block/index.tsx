"use client"
// playlist_block — Meme ecart que `latest_release` : le bouton Spotify etait
// vert plein dans l'apercu, translucide en ligne. Les deux autres concordaient.
import { playlist } from "../../models/musique"
import { Pochette, BoutonPlateforme } from "../../views/Musique"
import { BlockEmptyState, HIDDEN_WHEN_EMPTY_NOTE } from "../../primitives/BlockEmptyState"
import { sz, editorCtx, publicCtx, type UnifiedCtx, type EditorAdapterProps, type PublicAdapterProps } from "../../renderTypes"

const VERT = "#1DB954"

function Vue({ u, c }: { u: UnifiedCtx; c: Record<string, any> }) {
  const p = playlist(c)!
  return (
    <div style={{ padding: `${sz(u, 10)}px ${sz(u, 24)}px ${sz(u, 14)}px`, fontFamily: u.FONT_B }}>
      <div style={{ display: "flex", gap: sz(u, 13), alignItems: "center", marginBottom: sz(u, 13) }}>
        <Pochette u={u} src={p.pochette} cote={62} rayon={11} repli="📋" />
        <div style={{ flex: 1, minWidth: 0 }}>
          {p.titre && <p style={{ color: u.TEXT, fontSize: sz(u, 15), fontWeight: 700, margin: `0 0 ${sz(u, 3)}px`, fontFamily: u.FONT_B }}>{p.titre}</p>}
          {p.description && <p style={{ color: u.MUTED, fontSize: sz(u, 13.5), margin: `0 0 ${sz(u, 3)}px`, fontFamily: u.FONT_B }}>{p.description}</p>}
          {p.titres && <p style={{ color: VERT, fontSize: sz(u, 12), margin: 0, fontWeight: 600, fontFamily: u.FONT_B }}>🎵 {p.titres}</p>}
        </div>
      </div>
      {p.plateformes.length > 0 && (
        <div style={{ display: "flex", gap: sz(u, 8) }}>
          {p.plateformes.map(x => (
            <BoutonPlateforme key={x.cle} u={u} p={x} plein={false}
              style={{ flex: 1, borderRadius: 9, padding: sz(u, 10), textAlign: "center", fontSize: sz(u, 12), fontWeight: 700 }} />
          ))}
        </div>
      )}
    </div>
  )
}

export function EditorPlaylistBlock({ content, ctx }: EditorAdapterProps) {
  const u = editorCtx(ctx)
  if (!playlist(content)) return <div style={{ padding: "10px 16px" }}><BlockEmptyState icon="📋" label="Nommez la playlist ou ajoutez un lien" sub={HIDDEN_WHEN_EMPTY_NOTE} muted={u.MUTED} /></div>
  return <Vue u={u} c={content} />
}
export function PublicPlaylistBlock({ content, ctx }: PublicAdapterProps) {
  if (!playlist(content)) return null
  return <Vue u={publicCtx(ctx)} c={content} />
}
