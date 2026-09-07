"use client"
// product — La fiche produit. Deux ecarts corriges en migrant :
//
//  · l'apercu ecrivait « Produit » a la place du nom manquant, alors que la
//    page n'affiche rien ;
//  · l'apercu n'affichait PAS la description. Un champ que le commercant
//    remplit, que le visiteur lit, et que l'auteur ne voyait jamais.
import { produit } from "../../models/produitsEtTarifs"
import { PhotoProduit, LignePrix, EtatStock, BoutonAchat, CadreProduit } from "../../views/CarteProduit"
import { BlockEmptyState, HIDDEN_WHEN_EMPTY_NOTE } from "../../primitives/BlockEmptyState"
import { sz, editorCtx, publicCtx, type UnifiedCtx, type EditorAdapterProps, type PublicAdapterProps } from "../../renderTypes"

function Vue({ u, c }: { u: UnifiedCtx; c: Record<string, any> }) {
  const p = produit(c)!
  const bouton = { display: "block", background: `linear-gradient(90deg,${u.G},${u.G}cc)`, color: "#080808", textAlign: "center" as const, padding: `${sz(u, 12)}px`, borderRadius: 9, textDecoration: "none", fontSize: sz(u, 14), fontWeight: 700, fontFamily: u.FONT_B }
  return (
    <div style={{ padding: `${sz(u, 6)}px ${sz(u, 24)}px ${sz(u, 16)}px`, fontFamily: u.FONT_B }}>
      <CadreProduit u={u}>
        <PhotoProduit u={u} src={p.image} alt={p.nom} hauteur={180} />
        <div style={{ padding: `${sz(u, 14)}px ${sz(u, 16)}px` }}>
          {p.nom && <p style={{ color: u.TEXT, fontSize: sz(u, 16), fontWeight: 700, margin: `0 0 ${sz(u, 5)}px`, fontFamily: u.FONT_D }}>{p.nom}</p>}
          <LignePrix u={u} prix={p.prix} ancienPrix={p.ancienPrix} remise={p.remise} taille={20} marge={7} />
          {p.description && <p style={{ color: u.MUTED, fontSize: sz(u, 13), margin: `0 0 ${sz(u, 10)}px`, lineHeight: 1.6, fontFamily: u.FONT_B }}>{p.description}</p>}
          <EtatStock u={u} stock={p.stock} />
          <BoutonAchat u={u} p={p} style={bouton} styleEpuise={{ ...bouton, background: u.FILL, color: u.MUTED }} />
        </div>
      </CadreProduit>
    </div>
  )
}

export function EditorProduct({ content, ctx }: EditorAdapterProps) {
  const u = editorCtx(ctx)
  if (!produit(content)) return <div style={{ padding: "10px 16px" }}><BlockEmptyState icon="🏷️" label="Ajoutez un nom, une photo ou un prix" sub={HIDDEN_WHEN_EMPTY_NOTE} muted={u.MUTED} /></div>
  return <Vue u={u} c={content} />
}
export function PublicProduct({ content, ctx }: PublicAdapterProps) {
  if (!produit(content)) return null
  return <Vue u={publicCtx(ctx)} c={content} />
}
