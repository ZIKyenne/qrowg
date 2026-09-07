"use client"
// latest_release — La derniere sortie. Le bouton Spotify etait vert PLEIN dans
// l'apercu et translucide en ligne : deux dessins pour le meme bouton, et
// seulement pour Spotify — Apple et YouTube, eux, concordaient.
import { derniereSortie } from "../../models/musique"
import { Pochette, BoutonPlateforme } from "../../views/Musique"
import { BlockEmptyState, HIDDEN_WHEN_EMPTY_NOTE } from "../../primitives/BlockEmptyState"
import { sz, editorCtx, publicCtx, type UnifiedCtx, type EditorAdapterProps, type PublicAdapterProps } from "../../renderTypes"

const VERT = "#1DB954"

function Vue({ u, c }: { u: UnifiedCtx; c: Record<string, any> }) {
  const s = derniereSortie(c)!
  return (
    <div style={{ padding: `${sz(u, 10)}px ${sz(u, 24)}px ${sz(u, 14)}px`, fontFamily: u.FONT_B }}>
      <div style={{ background: `linear-gradient(135deg,${VERT}1f,${VERT}0f)`, border: `1.5px solid ${VERT}4d`, borderRadius: 16, overflow: "hidden" }}>
        {s.badge && <div style={{ background: `${VERT}33`, padding: `${sz(u, 7)}px ${sz(u, 14)}px`, fontSize: sz(u, 12), fontWeight: 700, color: VERT, textAlign: "center", fontFamily: u.FONT_B }}>{s.badge}</div>}
        <div style={{ display: "flex", gap: sz(u, 14), padding: sz(u, 15) }}>
          <Pochette u={u} src={s.pochette} cote={84} rayon={11} ombre="0 4px 16px rgba(0,0,0,0.4)" repli="🎵" />
          <div style={{ flex: 1, minWidth: 0 }}>
            {s.titre && <p style={{ color: u.TEXT, fontSize: sz(u, 17), fontWeight: 700, margin: `0 0 ${sz(u, 3)}px`, fontFamily: u.FONT_D }}>{s.titre}</p>}
            {s.artiste && <p style={{ color: u.MUTED, fontSize: sz(u, 13), margin: `0 0 ${sz(u, 4)}px`, fontFamily: u.FONT_B }}>{s.artiste}</p>}
            {s.date && <p style={{ color: VERT, fontSize: sz(u, 12), margin: `0 0 ${sz(u, 10)}px`, fontWeight: 600, fontFamily: u.FONT_B }}>📅 {s.date}</p>}
            <div style={{ display: "flex", gap: sz(u, 6), flexWrap: "wrap" }}>
              {s.plateformes.map(p => (
                <BoutonPlateforme key={p.cle} u={u} p={p} plein={false}
                  style={{ borderRadius: 7, padding: `${sz(u, 5)}px ${sz(u, 11)}px`, fontSize: sz(u, 11), fontWeight: 700 }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function EditorLatestRelease({ content, ctx }: EditorAdapterProps) {
  const u = editorCtx(ctx)
  if (!derniereSortie(content)) return <div style={{ padding: "10px 16px" }}><BlockEmptyState icon="💿" label="Ajoutez un titre, une pochette ou un lien d’écoute" sub={HIDDEN_WHEN_EMPTY_NOTE} muted={u.MUTED} /></div>
  return <Vue u={u} c={content} />
}
export function PublicLatestRelease({ content, ctx }: PublicAdapterProps) {
  if (!derniereSortie(content)) return null
  return <Vue u={publicCtx(ctx)} c={content} />
}
