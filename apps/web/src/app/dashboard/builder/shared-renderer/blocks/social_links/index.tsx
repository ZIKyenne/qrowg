"use client"
// social_links — Les liens vers les profils. Trois ecarts corriges en migrant :
//
//  · la page publiee redeclarait `website` en tete de sa table, alors que
//    l'editeur l'avait deja en 74e position : le site du commercant apparaissait
//    en dernier dans l'apercu et en premier en ligne ;
//  · en affichage « icones », le libelle personnalise d'un reseau etait ignore
//    par l'apercu — et c'est ce libelle que lit un lecteur d'ecran, puisqu'une
//    icone seule ne dit rien ;
//  · l'apercu ecrivait « Aucun réseau configuré » sans dire que le bloc serait
//    invisible en ligne.
import { reseauxActifs, affichageReseaux, type Reseau } from "../../models/horairesGalerieReseaux"
import { BlockEmptyState, HIDDEN_WHEN_EMPTY_NOTE } from "../../primitives/BlockEmptyState"
import { sz, editorCtx, publicCtx, type UnifiedCtx, type EditorAdapterProps, type PublicAdapterProps } from "../../renderTypes"
import { ExternalLink } from "lucide-react"
import type { CSSProperties, ReactNode } from "react"

/** Un vrai lien en ligne, une coquille inerte dans le canvas : cliquer une
 *  vignette de l'editeur doit selectionner le bloc, pas quitter la page. */
function Lien({ u, r, style, children, label }: { u: UnifiedCtx; r: Reseau; style: CSSProperties; children: ReactNode; label?: string }) {
  if (u.mode !== "public") return <div aria-disabled="true" title={label} style={style}>{children}</div>
  return (
    <a href={r.href} onClick={() => u.trackClick(r.href)} target="_blank" rel="noopener noreferrer"
      aria-label={label} title={label} style={{ ...style, textDecoration: "none" }}>{children}</a>
  )
}

function Vue({ u, c }: { u: UnifiedCtx; c: Record<string, any> }) {
  const reseaux = reseauxActifs(c)
  const affichage = affichageReseaux(c)
  const pad = `${sz(u, 6)}px ${sz(u, 24)}px ${sz(u, 16)}px`

  if (affichage === "icons") return (
    <div style={{ padding: pad, display: "flex", flexWrap: "wrap", gap: sz(u, 10), justifyContent: "center", fontFamily: u.FONT_B }}>
      {reseaux.map(r => (
        <Lien key={r.cle} u={u} r={r} label={r.libelle}
          style={{ width: sz(u, 48), height: sz(u, 48), borderRadius: "50%", background: r.couleur + "1a", border: `1px solid ${r.couleur}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: sz(u, 22) }}>
          {r.icone}
        </Lien>
      ))}
    </div>
  )

  if (affichage === "grid") return (
    <div style={{ padding: pad, display: "grid", gridTemplateColumns: "1fr 1fr", gap: sz(u, 9), fontFamily: u.FONT_B }}>
      {reseaux.map(r => (
        <Lien key={r.cle} u={u} r={r}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: sz(u, 4), background: r.couleur + "10", border: `1px solid ${r.couleur}25`, borderRadius: 13, padding: `${sz(u, 16)}px ${sz(u, 8)}px`, textAlign: "center" }}>
          <span style={{ fontSize: sz(u, 26) }}>{r.icone}</span>
          <span style={{ color: u.TEXT, fontSize: sz(u, 13), fontWeight: 600, fontFamily: u.FONT_B }}>{r.libelle}</span>
          {r.compte && <span style={{ color: r.couleur, fontSize: sz(u, 11), fontWeight: 700, fontFamily: u.FONT_B }}>{r.compte}</span>}
        </Lien>
      ))}
    </div>
  )

  return (
    <div style={{ padding: pad, display: "flex", flexDirection: "column", gap: sz(u, 9), fontFamily: u.FONT_B }}>
      {reseaux.map(r => (
        <Lien key={r.cle} u={u} r={r}
          style={{ display: "flex", alignItems: "center", gap: sz(u, 13), background: r.couleur + "10", border: `1px solid ${r.couleur}22`, borderRadius: 13, padding: `${sz(u, 13)}px ${sz(u, 16)}px` }}>
          <div style={{ width: sz(u, 38), height: sz(u, 38), borderRadius: 10, background: r.couleur + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: sz(u, 18), flexShrink: 0 }}>{r.icone}</div>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ color: u.TEXT, fontSize: sz(u, 14), fontWeight: 600, fontFamily: u.FONT_B, display: "block" }}>{r.libelle}</span>
            {r.compte && <span style={{ color: u.MUTED, fontSize: sz(u, 12), fontFamily: u.FONT_B }}>{r.compte}</span>}
          </span>
          <ExternalLink size={sz(u, 14)} color={r.couleur} style={{ opacity: 0.7, flexShrink: 0 }} />
        </Lien>
      ))}
    </div>
  )
}

export function EditorSocialLinks({ content, ctx }: EditorAdapterProps) {
  const u = editorCtx(ctx)
  if (reseauxActifs(content).length === 0) return <div style={{ padding: "10px 16px" }}><BlockEmptyState icon="📲" label="Ajoutez au moins un réseau" sub={HIDDEN_WHEN_EMPTY_NOTE} muted={u.MUTED} /></div>
  return <Vue u={u} c={content} />
}
export function PublicSocialLinks({ content, ctx }: PublicAdapterProps) {
  if (reseauxActifs(content).length === 0) return null
  return <Vue u={publicCtx(ctx)} c={content} />
}
