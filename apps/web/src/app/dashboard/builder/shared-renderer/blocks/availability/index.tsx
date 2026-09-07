"use client"
// availability — Le statut du freelance ou de l'artisan. `availabilityStatus`
// retombait sur le PREMIER statut de la liste, « Disponible » : un bloc ou seul
// le message etait saisi annoncait donc au visiteur que le commercant EST
// disponible — une affirmation que personne n'avait faite. Meme famille que les
// horaires inventes du contenu par defaut.
import { disponibilite } from "../../models/informationsEtAnnonces"
import { PublicCtaLink, EditorCtaShell } from "../../primitives/BlockCtaLink"
import { BlockEmptyState, HIDDEN_WHEN_EMPTY_NOTE } from "../../primitives/BlockEmptyState"
import { sz, editorCtx, publicCtx, type UnifiedCtx, type EditorAdapterProps, type PublicAdapterProps } from "../../renderTypes"

function Vue({ u, c }: { u: UnifiedCtx; c: Record<string, any> }) {
  const d = disponibilite(c)!
  const styleCta = { display: "block", background: `linear-gradient(90deg,${u.G},${u.G}cc)`, borderRadius: 10, padding: `${sz(u, 11)}px`, textAlign: "center" as const, fontSize: sz(u, 14), fontWeight: 700, color: "#080808", textDecoration: "none", fontFamily: u.FONT_B }
  return (
    <div style={{ padding: `${sz(u, 8)}px ${sz(u, 24)}px ${sz(u, 12)}px`, fontFamily: u.FONT_B }}>
      <div style={{ background: d.fond, border: `1px solid ${d.bordure}`, borderRadius: 14, padding: `${sz(u, 14)}px ${sz(u, 16)}px` }}>
        <div style={{ display: "flex", alignItems: "center", gap: sz(u, 8), marginBottom: d.message ? sz(u, 7) : 0 }}>
          <span aria-hidden style={{ width: sz(u, 9), height: sz(u, 9), borderRadius: "50%", background: d.couleur, boxShadow: `0 0 8px ${d.couleur}80`, flexShrink: 0 }} />
          {d.label && <p style={{ color: u.TEXT, fontSize: sz(u, 15), fontWeight: 700, margin: 0, fontFamily: u.FONT_B }}>{d.label}</p>}
          {d.depuis && <span style={{ color: u.MUTED, fontSize: sz(u, 12), marginLeft: "auto", fontFamily: u.FONT_B }}>dès {d.depuis}</span>}
        </div>
        {d.message && <p style={{ color: u.MUTED, fontSize: sz(u, 13), margin: `0 0 ${d.cta ? sz(u, 10) : 0}px`, lineHeight: 1.5, fontFamily: u.FONT_B }}>{d.message}</p>}
        {d.cta && (u.mode === "public"
          ? <PublicCtaLink href={d.cta.href} external={/^https?:/i.test(d.cta.href)} trackTarget={d.cta.href} trackClick={u.trackClick} style={styleCta}>{d.cta.label}</PublicCtaLink>
          : <EditorCtaShell style={styleCta}>{d.cta.label}</EditorCtaShell>)}
      </div>
    </div>
  )
}

export function EditorAvailability({ content, ctx }: EditorAdapterProps) {
  const u = editorCtx(ctx)
  if (!disponibilite(content)) return <div style={{ padding: "10px 16px" }}><BlockEmptyState icon="🟢" label="Choisissez votre statut de disponibilité" sub={HIDDEN_WHEN_EMPTY_NOTE} muted={u.MUTED} /></div>
  return <Vue u={u} c={content} />
}
export function PublicAvailability({ content, ctx }: PublicAdapterProps) {
  if (!disponibilite(content)) return null
  return <Vue u={publicCtx(ctx)} c={content} />
}
