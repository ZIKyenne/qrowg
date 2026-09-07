"use client"
// featured_product — Le produit mis en avant. L'apercu inventait un prix de
// « 99€ » quand le champ etait vide. Pire : la remise etait calculee CONTRE ce
// faux prix, donc l'auteur voyait un pourcentage qui n'existait pas. Meme
// famille que le « 1 240 » du compteur de scans, mais sur un chiffre
// commercial — celui qui decide de l'achat.
import { produitVedette } from "../../models/produitsEtTarifs"
import { PhotoProduit, LignePrix, EtatStock, BoutonAchat } from "../../views/CarteProduit"
import { BlockEmptyState, HIDDEN_WHEN_EMPTY_NOTE } from "../../primitives/BlockEmptyState"
import { sz, editorCtx, publicCtx, type UnifiedCtx, type EditorAdapterProps, type PublicAdapterProps } from "../../renderTypes"

function Vue({ u, c, accent }: { u: UnifiedCtx; c: Record<string, any>; accent: string }) {
  const p = produitVedette(c)!
  const bouton = { display: "block", background: `linear-gradient(90deg,${u.G},${u.G}cc)`, borderRadius: 11, padding: `${sz(u, 13)}px`, textAlign: "center" as const, fontSize: sz(u, 14), fontWeight: 800, color: "#080808", textDecoration: "none", fontFamily: u.FONT_B }
  return (
    <div style={{ padding: `${sz(u, 10)}px ${sz(u, 24)}px ${sz(u, 14)}px`, fontFamily: u.FONT_B }}>
      <div style={{ background: `linear-gradient(135deg,${u.G}12,${accent}0a)`, border: `1.5px solid ${u.G}30`, borderRadius: 16, overflow: "hidden" }}>
        {p.badge && <div style={{ background: p.badge.fond, color: p.badge.texteSur, padding: `${sz(u, 7)}px ${sz(u, 14)}px`, fontSize: sz(u, 12), fontWeight: 700, textAlign: "center", fontFamily: u.FONT_B }}>{p.badge.icone ? p.badge.icone + " " : ""}{p.badge.texte}</div>}
        {p.image
          ? <PhotoProduit u={u} src={p.image} alt={p.nom} hauteur={200} />
          : <div aria-hidden style={{ height: sz(u, 150), display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(249,115,22,0.06)", fontSize: sz(u, 48) }}>⭐</div>}
        <div style={{ padding: sz(u, 16) }}>
          {p.nom && <p style={{ color: u.TEXT, fontSize: sz(u, 18), fontWeight: 700, margin: `0 0 ${sz(u, 6)}px`, fontFamily: u.FONT_D }}>{p.nom}</p>}
          {p.description && <p style={{ color: u.MUTED, fontSize: sz(u, 13), margin: `0 0 ${sz(u, 12)}px`, lineHeight: 1.5, fontFamily: u.FONT_B }}>{p.description}</p>}
          <LignePrix u={u} prix={p.prix} ancienPrix={p.ancienPrix} remise={p.remise} taille={24} marge={p.cta || p.epuise ? 14 : 0} />
          <EtatStock u={u} stock={p.stock} />
          <BoutonAchat u={u} p={p} style={bouton} styleEpuise={{ ...bouton, background: u.FILL, color: u.MUTED }} />
        </div>
      </div>
    </div>
  )
}

export function EditorFeaturedProduct({ content, ctx }: EditorAdapterProps) {
  const u = editorCtx(ctx)
  if (!produitVedette(content)) return <div style={{ padding: "10px 16px" }}><BlockEmptyState icon="⭐" label="Ajoutez un produit" sub={HIDDEN_WHEN_EMPTY_NOTE} muted={u.MUTED} /></div>
  return <Vue u={u} c={content} accent={ctx.accent} />
}
export function PublicFeaturedProduct({ content, ctx }: PublicAdapterProps) {
  if (!produitVedette(content)) return null
  return <Vue u={publicCtx(ctx)} c={content} accent={(ctx.theme as any)?.accent || "var(--success)"} />
}
