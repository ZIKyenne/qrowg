"use client"
// external_shop — « Voir la boutique » vers Shopify, Etsy, Vinted…
import { ExternalLink } from "lucide-react"
import { boutiqueEnLigne } from "../../models/actionsExternes"
import { SmartCta } from "../../primitives/LayoutSurface"
import { BlockEmptyState, HIDDEN_WHEN_EMPTY_NOTE } from "../../primitives/BlockEmptyState"
import { sz, editorCtx, publicCtx, type UnifiedCtx, type EditorAdapterProps, type PublicAdapterProps } from "../../renderTypes"

function Vue({ u, m }: { u: UnifiedCtx; m: NonNullable<ReturnType<typeof boutiqueEnLigne>> }) {
  return (
    <div style={{ padding: `${sz(u, 6)}px ${sz(u, 24)}px ${sz(u, 14)}px`, fontFamily: u.FONT_B }}>
      {m.description && <p style={{ color: u.MUTED, fontSize: sz(u, 13), margin: `0 0 ${sz(u, 11)}px`, textAlign: "center" }}>{m.description}</p>}
      <SmartCta u={u} href={m.href} external={m.externe} label={
        <>
          <span aria-hidden style={{ fontSize: sz(u, 21) }}>🛒</span>
          <span><span style={{ display: "block", color: u.TEXT, fontSize: sz(u, 14), fontWeight: 700, fontFamily: u.FONT_B }}>{m.label}</span>{m.plateforme && <span style={{ display: "block", color: u.MUTED, fontSize: sz(u, 11) }}>via {m.plateforme}</span>}</span>
          <ExternalLink aria-hidden size={sz(u, 14)} color={u.G} style={{ marginLeft: "auto" }} />
        </>
      } style={{ display: "flex", width: "100%", alignItems: "center", justifyContent: "center", gap: sz(u, 10), background: `${u.G}10`, border: `1.5px solid ${u.G}30`, borderRadius: sz(u, 13), padding: `${sz(u, 15)}px ${sz(u, 18)}px`, textDecoration: "none" }} />
    </div>
  )
}

export function EditorExternalShop({ content, ctx }: EditorAdapterProps) {
  const u = editorCtx(ctx)
  const m = boutiqueEnLigne(content)
  if (!m) return <div style={{ padding: "10px 16px" }}><BlockEmptyState icon="🛒" label="Ajoutez le lien de votre boutique" sub={HIDDEN_WHEN_EMPTY_NOTE} muted={u.MUTED} /></div>
  return <Vue u={u} m={m} />
}
export function PublicExternalShop({ content, ctx }: PublicAdapterProps) {
  const m = boutiqueEnLigne(content)
  return m ? <Vue u={publicCtx(ctx)} m={m} /> : null
}
