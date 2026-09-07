"use client"
// Vue partagée des deux fiches produit : `product` et `featured_product`.
// Même géométrie, même règle d'épuisement, même image dimensionnée — l'aperçu
// rendait auparavant un <img> brut, donc l'original en pleine taille sur le
// téléphone de l'auteur, à chaque ouverture du canvas.
import { sharedImageModel } from "../models/sharedImage"
import { PublicSharedImage } from "../primitives/PublicImage"
import { EditorSharedImage } from "../primitives/EditorImage"
import { PublicCtaLink, EditorCtaShell } from "../primitives/BlockCtaLink"
import { sz, type UnifiedCtx } from "../renderTypes"
import type { Produit, Remise, Stock } from "../models/produitsEtTarifs"
import type { CSSProperties, ReactNode } from "react"

export function PhotoProduit({ u, src, alt, hauteur }: { u: UnifiedCtx; src: string; alt: string; hauteur: number }) {
  const m = sharedImageModel(src, { alt })
  if (!m.src) return null
  const style: CSSProperties = { width: "100%", height: sz(u, hauteur), objectFit: "cover", display: "block" }
  return u.mode === "public"
    ? <PublicSharedImage model={m} width={1600} height={1200} sizes="(max-width: 520px) 100vw, 520px" style={style} />
    : <EditorSharedImage model={m} width={1600} height={1200} sizes="(max-width: 520px) 100vw, 520px" style={style} />
}

export function LignePrix({ u, prix, ancienPrix, remise, taille, marge }: { u: UnifiedCtx; prix: string; ancienPrix: string; remise: Remise; taille: number; marge: number }) {
  if (!prix && !ancienPrix) return null
  return (
    <div style={{ display: "flex", alignItems: "center", gap: sz(u, 9), marginBottom: sz(u, marge) }}>
      {prix && <span style={{ color: u.G, fontSize: sz(u, taille), fontWeight: 700, fontFamily: u.FONT_D }}>{prix}</span>}
      {ancienPrix && <span style={{ color: u.MUTED, fontSize: sz(u, 13), textDecoration: "line-through", fontFamily: u.FONT_B }}>{ancienPrix}</span>}
      {remise && <span style={{ background: "#EF4444", color: "#fff", borderRadius: 5, padding: `${sz(u, 2)}px ${sz(u, 7)}px`, fontSize: sz(u, 11), fontWeight: 800, fontFamily: u.FONT_B }}>{remise.label}</span>}
    </div>
  )
}

export function EtatStock({ u, stock }: { u: UnifiedCtx; stock: Stock }) {
  if (!stock) return null
  const prefixe = stock.state === "in" ? "✓ " : stock.state === "out" ? "⛔ " : "🔥 "
  return <p style={{ color: stock.color, fontSize: sz(u, 12), fontWeight: 700, margin: `0 0 ${sz(u, 10)}px`, fontFamily: u.FONT_B }}>{prefixe}{stock.label}</p>
}

/** Le bouton d'achat, ou la mention « Épuisé » qui le remplace. */
export function BoutonAchat({ u, p, style, styleEpuise }: { u: UnifiedCtx; p: Produit; style: CSSProperties; styleEpuise: CSSProperties }) {
  if (p.epuise) return <div aria-disabled="true" style={{ ...styleEpuise, cursor: "not-allowed" }}>Épuisé</div>
  if (!p.cta) return null
  return u.mode === "public"
    ? <PublicCtaLink href={p.cta.href} external={/^https?:/i.test(p.cta.href)} trackTarget={p.cta.href} trackClick={u.trackClick} style={style}>{p.cta.label}</PublicCtaLink>
    : <EditorCtaShell style={style}>{p.cta.label}</EditorCtaShell>
}

export function CadreProduit({ u, children, style }: { u: UnifiedCtx; children: ReactNode; style?: CSSProperties }) {
  return <div style={{ background: u.FILL, border: `1px solid ${u.LINE}`, borderRadius: 15, overflow: "hidden", ...style }}>{children}</div>
}
