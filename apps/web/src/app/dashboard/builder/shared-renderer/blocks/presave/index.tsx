"use client"
// presave — La pre-sauvegarde d'une sortie. Sans AUCUNE adresse de plateforme,
// l'apercu dessinait quand meme un bouton vert « Pre-sauvegarder sur Spotify ».
// La page n'en publie aucun : le bouton n'existait que dans le canvas.
import { presave } from "../../models/musique"
import { Pochette, BoutonPlateforme } from "../../views/Musique"
import { BlockEmptyState, HIDDEN_WHEN_EMPTY_NOTE } from "../../primitives/BlockEmptyState"
import { sz, editorCtx, publicCtx, type UnifiedCtx, type EditorAdapterProps, type PublicAdapterProps } from "../../renderTypes"

const VERT = "#1DB954"

function Vue({ u, c }: { u: UnifiedCtx; c: Record<string, any> }) {
  const p = presave(c)!
  return (
    <div style={{ padding: `${sz(u, 10)}px ${sz(u, 24)}px ${sz(u, 14)}px`, fontFamily: u.FONT_B }}>
      {p.titre && <p style={{ color: u.MUTED, fontSize: sz(u, 11), textTransform: "uppercase", letterSpacing: 2, margin: `0 0 ${sz(u, 9)}px`, textAlign: "center", fontFamily: u.FONT_B }}>{p.titre}</p>}
      <div style={{ background: `linear-gradient(135deg,${VERT}1a,${VERT}0d)`, border: `1.5px solid ${VERT}4d`, borderRadius: 16, padding: sz(u, 17), textAlign: "center" }}>
        <Pochette u={u} src={p.pochette} cote={110} rayon={13} ombre="0 4px 20px rgba(0,0,0,0.4)" repli="💾" marge={`0 auto ${sz(u, 13)}px`} />
        {p.nom && <p style={{ color: u.TEXT, fontSize: sz(u, 17), fontWeight: 700, margin: `0 0 ${sz(u, 3)}px`, fontFamily: u.FONT_D }}>{p.nom}</p>}
        {p.date && <p style={{ color: VERT, fontSize: sz(u, 13), fontWeight: 600, margin: `0 0 ${sz(u, 15)}px`, fontFamily: u.FONT_B }}>📅 Sortie le {p.date}</p>}
        {p.plateformes.length > 0 && (
          <div style={{ display: "flex", gap: sz(u, 8) }}>
            {p.plateformes.map(x => (
              <BoutonPlateforme key={x.cle} u={u} p={x} plein
                style={{ flex: 1, borderRadius: 10, padding: sz(u, 12), fontSize: sz(u, 12), fontWeight: 700, textAlign: "center" }} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export function EditorPresave({ content, ctx }: EditorAdapterProps) {
  const u = editorCtx(ctx)
  if (!presave(content)) return <div style={{ padding: "10px 16px" }}><BlockEmptyState icon="💾" label="Nommez la sortie ou ajoutez un lien de pré-save" sub={HIDDEN_WHEN_EMPTY_NOTE} muted={u.MUTED} /></div>
  return <Vue u={u} c={content} />
}
export function PublicPresave({ content, ctx }: PublicAdapterProps) {
  if (!presave(content)) return null
  return <Vue u={publicCtx(ctx)} c={content} />
}
