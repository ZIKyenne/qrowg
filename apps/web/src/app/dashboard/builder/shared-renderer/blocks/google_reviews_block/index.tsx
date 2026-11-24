"use client"
// google_reviews_block — Une note moyenne et des avis recopiés de Google.
// L'aperçu inventait « 5.0 » et cinq étoiles quand seule la ligne de titre
// était remplie : une note que le commerçant n'a jamais eue, sous ses yeux.
import { avisGoogle, type AvisGoogle } from "../../models/medias"
import { Etoiles } from "../../primitives/Etoiles"
import { SmartCta } from "../../primitives/LayoutSurface"
import { pagePad } from "../../views/TitreSection"
import { BlockEmptyState, HIDDEN_WHEN_EMPTY_NOTE } from "../../primitives/BlockEmptyState"
import { sz, editorCtx, publicCtx, type UnifiedCtx, type EditorAdapterProps, type PublicAdapterProps } from "../../renderTypes"

function Vue({ u, m }: { u: UnifiedCtx; m: AvisGoogle }) {
  const h = m.enTete
  return (
    <div style={{ padding: pagePad(u), fontFamily: u.FONT_B }}>
      {h && (
        <div style={{ display: "flex", alignItems: "center", gap: sz(u, 13), marginBottom: sz(u, 13), padding: `${sz(u, 12)}px ${sz(u, 14)}px`, background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: sz(u, 11) }}>
          {h.note && (
            <div style={{ textAlign: "center" }}>
              <p style={{ color: u.lisible("#FBBF24"), fontSize: sz(u, 30), fontWeight: 700, margin: 0, fontFamily: u.FONT_D }}>{h.note}</p>
              <Etoiles remplissage={h.etoiles} taille={sz(u, 11)} />
            </div>
          )}
          <div>
            <h2 style={{ color: u.TEXT, fontSize: sz(u, 13), fontWeight: 700, margin: `0 0 ${sz(u, 2)}px`, fontFamily: u.FONT_B }}>{h.titre}</h2>
            {h.total && <p style={{ color: u.MUTED, fontSize: sz(u, 11), margin: 0 }}>{h.total} avis</p>}
          </div>
        </div>
      )}
      {m.avis.length > 0 && (
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: sz(u, 8) }}>
          {m.avis.map((a, i) => (
            <li key={i} style={{ background: u.FILL, border: `1px solid ${u.LINE}`, borderRadius: sz(u, 10), padding: `${sz(u, 11)}px ${sz(u, 13)}px` }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: sz(u, 8), marginBottom: sz(u, 4) }}>
                <p style={{ color: u.TEXT, fontSize: sz(u, 12), fontWeight: 700, margin: 0, fontFamily: u.FONT_B }}>{a.nom}</p>
                {a.etoiles.length > 0 && <Etoiles remplissage={a.etoiles} taille={sz(u, 11)} />}
              </div>
              {a.texte && <p style={{ color: u.MUTED, fontSize: sz(u, 12), margin: 0, lineHeight: 1.5, fontStyle: "italic" }}>&quot;{a.texte}&quot;</p>}
            </li>
          ))}
        </ul>
      )}
      {m.lienGoogle && (
        <SmartCta u={u} href={m.lienGoogle} label={<><span aria-hidden>📍</span> Voir sur Google</>}
          style={{ marginTop: sz(u, 11), display: "flex", alignItems: "center", justifyContent: "center", gap: 7, color: u.lisible("#4285F4"), fontSize: sz(u, 12), fontWeight: 600, textDecoration: "none" }} />
      )}
    </div>
  )
}

export function EditorGoogleReviewsBlock({ content, ctx }: EditorAdapterProps) {
  const u = editorCtx(ctx)
  const m = avisGoogle(content)
  if (!m) return <div style={{ padding: "10px 16px" }}><BlockEmptyState icon="⭐" label="Ajoutez un avis ou une note" sub={HIDDEN_WHEN_EMPTY_NOTE} muted={u.MUTED} /></div>
  return <Vue u={u} m={m} />
}
export function PublicGoogleReviewsBlock({ content, ctx }: PublicAdapterProps) {
  const m = avisGoogle(content)
  if (!m) return null
  return <Vue u={publicCtx(ctx)} m={m} />
}
