"use client"
// payment_button — Un bouton de paiement aux couleurs de la plateforme
// (Stripe, PayPal, Lydia…). L'aperçu affichait encore « ⚠ Ajoutez le lien de
// paiement pour activer le bouton » sous un bouton déjà actif : le bloc ne
// s'affiche plus du tout sans lien, la mise en garde ne pouvait plus servir.
import { boutonDePaiement } from "../../models/actionsExternes"
import { SmartCta } from "../../primitives/LayoutSurface"
import { BlockEmptyState, HIDDEN_WHEN_EMPTY_NOTE } from "../../primitives/BlockEmptyState"
import { sz, editorCtx, publicCtx, type UnifiedCtx, type EditorAdapterProps, type PublicAdapterProps } from "../../renderTypes"

function Vue({ u, m }: { u: UnifiedCtx; m: NonNullable<ReturnType<typeof boutonDePaiement>> }) {
  return (
    <div style={{ padding: `${sz(u, 6)}px ${sz(u, 24)}px ${sz(u, 10)}px` }}>
      <SmartCta u={u} href={m.href} trackTarget="payment" label={<><span aria-hidden>{m.icone}</span> {m.label}{m.montant ? ` — ${m.montant}` : ""}</>}
        style={{ display: "flex", width: "100%", alignItems: "center", justifyContent: "center", gap: sz(u, 9), background: m.couleur, borderRadius: sz(u, 13), padding: `${sz(u, 15)}px ${sz(u, 18)}px`, textDecoration: "none", color: "#fff", fontSize: sz(u, 15), fontWeight: 800, fontFamily: u.FONT_B, boxShadow: `0 4px 16px ${m.couleur}44` }} />
    </div>
  )
}

export function EditorPaymentButton({ content, ctx }: EditorAdapterProps) {
  const u = editorCtx(ctx)
  const m = boutonDePaiement(content)
  if (!m) return <div style={{ padding: "10px 16px" }}><BlockEmptyState icon="💳" label="Choisissez la plateforme et son lien" sub={HIDDEN_WHEN_EMPTY_NOTE} muted={u.MUTED} /></div>
  return <Vue u={u} m={m} />
}
export function PublicPaymentButton({ content, ctx }: PublicAdapterProps) {
  const m = boutonDePaiement(content)
  return m ? <Vue u={publicCtx(ctx)} m={m} /> : null
}
