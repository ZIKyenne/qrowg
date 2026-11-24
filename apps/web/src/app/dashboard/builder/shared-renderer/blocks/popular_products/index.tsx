"use client"
// popular_products — Le classement des meilleures ventes. Le premier est mis
// en avant ; une ligne avec une adresse devient cliquable (et comptée).
import SmartImage from "@/components/SmartImage"
import { produitsPopulaires, type ProduitPopulaire } from "../../models/affichagesSimples"
import { TitreSection, pagePad } from "../../views/TitreSection"
import { BlockEmptyState, HIDDEN_WHEN_EMPTY_NOTE } from "../../primitives/BlockEmptyState"
import { sz, editorCtx, publicCtx, type UnifiedCtx, type EditorAdapterProps, type PublicAdapterProps } from "../../renderTypes"

function Ligne({ u, p, premier }: { u: UnifiedCtx; p: ProduitPopulaire; premier: boolean }) {
  const cote = sz(u, 44)
  const corps = (
    <>
      {p.rang && <span aria-hidden style={{ fontSize: sz(u, 19), flexShrink: 0 }}>{p.rang}</span>}
      {p.img
        ? <SmartImage onError={e => { e.currentTarget.style.display = "none" }} src={p.img} alt="" width={88} height={88} sizes="44px" style={{ width: cote, height: cote, objectFit: "cover", borderRadius: sz(u, 8), flexShrink: 0 }} />
        : <div aria-hidden style={{ width: cote, height: cote, background: `${u.G}10`, borderRadius: sz(u, 8), display: "flex", alignItems: "center", justifyContent: "center", fontSize: sz(u, 21), flexShrink: 0 }}>🏆</div>}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ color: u.TEXT, fontSize: sz(u, 13), fontWeight: 700, margin: `0 0 ${sz(u, 1)}px`, fontFamily: u.FONT_B, overflowWrap: "anywhere" }}>{p.nom}</p>
        {p.ventes && <p style={{ color: u.MUTED, fontSize: sz(u, 11), margin: 0 }}>{p.ventes}</p>}
      </div>
      {p.prix && <span style={{ color: u.G, fontSize: sz(u, 14), fontWeight: 700, flexShrink: 0, maxWidth: "50%", overflowWrap: "anywhere", textAlign: "right" }}>{p.prix}</span>}
    </>
  )
  const st = { display: "flex", alignItems: "center", gap: sz(u, 11), background: premier ? `${u.G}08` : u.FILL, border: `1px solid ${premier ? `${u.G}20` : u.LINE}`, borderRadius: sz(u, 11), padding: `${sz(u, 11)}px ${sz(u, 13)}px`, textDecoration: "none" } as const
  // Le canvas ne suit aucun lien ; la page publiée, si — et compte le clic.
  if (u.mode === "public" && p.href) {
    const href = p.href
    return <a href={href} target="_blank" rel="noopener noreferrer" onClick={() => { try { u.trackClick(href) } catch {} }} style={st}>{corps}</a>
  }
  return <div style={st}>{corps}</div>
}

function Vue({ u, c, items }: { u: UnifiedCtx; c: Record<string, any>; items: ProduitPopulaire[] }) {
  return (
    <div style={{ padding: pagePad(u), fontFamily: u.FONT_B }}>
      <TitreSection u={u} titre={String(c?.title || "").trim()} marge={12} />
      {/* Un classement EST une liste : un lecteur d'écran annonce « liste, 5 éléments ». */}
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: sz(u, 8) }}>
        {items.map((p, i) => <li key={i}><Ligne u={u} p={p} premier={i === 0} /></li>)}
      </ul>
    </div>
  )
}

export function EditorPopularProducts({ content, ctx }: EditorAdapterProps) {
  const u = editorCtx(ctx)
  const items = produitsPopulaires(content)
  if (items.length === 0) return <div style={{ padding: "10px 16px" }}><BlockEmptyState icon="⭐" label="Nommez un produit" sub={HIDDEN_WHEN_EMPTY_NOTE} muted={u.MUTED} /></div>
  return <Vue u={u} c={content} items={items} />
}
export function PublicPopularProducts({ content, ctx }: PublicAdapterProps) {
  const items = produitsPopulaires(content)
  if (items.length === 0) return null
  return <Vue u={publicCtx(ctx)} c={content} items={items} />
}
