"use client"
// quote_request — « Demander un devis » vers le formulaire du commerçant.
// Le bloc n'avait pas de détecteur : l'aperçu dessinait le bouton sans
// adresse, la page n'en publiait aucun. Les deux disent maintenant la même chose.
import { demandeDeDevis } from "../../models/actionsExternes"
import { SmartCta } from "../../primitives/LayoutSurface"
import { BlockEmptyState, HIDDEN_WHEN_EMPTY_NOTE } from "../../primitives/BlockEmptyState"
import { sz, editorCtx, publicCtx, type UnifiedCtx, type EditorAdapterProps, type PublicAdapterProps } from "../../renderTypes"

function Vue({ u, m }: { u: UnifiedCtx; m: NonNullable<ReturnType<typeof demandeDeDevis>> }) {
  return (
    <div style={{ padding: `${sz(u, 6)}px ${sz(u, 24)}px ${sz(u, 12)}px`, fontFamily: u.FONT_B }}>
      <SmartCta u={u} href={m.href} external={m.externe} label={
        <>
          <span aria-hidden style={{ width: sz(u, 40), height: sz(u, 40), background: `${u.G}12`, borderRadius: sz(u, 9), display: "flex", alignItems: "center", justifyContent: "center", fontSize: sz(u, 19), flexShrink: 0 }}>📋</span>
          <span style={{ flex: 1 }}><span style={{ display: "block", color: u.TEXT, fontSize: sz(u, 13), fontWeight: 700, fontFamily: u.FONT_B }}>{m.label}</span>{m.description && <span style={{ display: "block", color: u.MUTED, fontSize: sz(u, 13) }}>{m.description}</span>}</span>
          <span aria-hidden style={{ color: u.G, fontSize: sz(u, 15) }}>→</span>
        </>
      } style={{ display: "flex", width: "100%", alignItems: "center", gap: sz(u, 11), background: `${u.G}08`, border: `1.5px solid ${u.G}20`, borderRadius: sz(u, 13), padding: `${sz(u, 12)}px ${sz(u, 15)}px`, textDecoration: "none" }} />
    </div>
  )
}

export function EditorQuoteRequest({ content, ctx }: EditorAdapterProps) {
  const u = editorCtx(ctx)
  const m = demandeDeDevis(content)
  if (!m) return <div style={{ padding: "10px 16px" }}><BlockEmptyState icon="📋" label="Ajoutez le lien de votre formulaire de devis" sub={HIDDEN_WHEN_EMPTY_NOTE} muted={u.MUTED} /></div>
  return <Vue u={u} m={m} />
}
export function PublicQuoteRequest({ content, ctx }: PublicAdapterProps) {
  const m = demandeDeDevis(content)
  return m ? <Vue u={publicCtx(ctx)} m={m} /> : null
}
