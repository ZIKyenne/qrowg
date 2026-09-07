"use client"
// Vue partagée des tableaux de formules : `offer_comparison` et `pricing`.
//
// `offer_comparison` posait le bouton DANS chaque formule côté aperçu (trois
// boutons) et UN SEUL sous le tableau côté page. Le commerçant composait une
// mise en page qu'il n'obtenait pas. Une seule vue, donc un seul dessin.
import { PublicCtaLink, EditorCtaShell } from "../primitives/BlockCtaLink"
import { sz, type UnifiedCtx } from "../renderTypes"
import type { Tableau } from "../models/produitsEtTarifs"

export function TableauFormules({ u, t, compact }: { u: UnifiedCtx; t: Tableau; compact: boolean }) {
  const bouton = { display: "block", marginTop: sz(u, 12), background: `linear-gradient(90deg,${u.G},${u.G}cc)`, color: "#080808", borderRadius: 10, padding: `${sz(u, 13)}px`, textAlign: "center" as const, fontSize: sz(u, 14), fontWeight: 700, textDecoration: "none", fontFamily: u.FONT_B }
  return (
    <div style={{ padding: `${sz(u, 16)}px ${sz(u, 24)}px ${sz(u, 14)}px`, fontFamily: u.FONT_B }}>
      {t.titre && <p style={{ color: u.MUTED, fontSize: sz(u, 11), textTransform: "uppercase", letterSpacing: 2, margin: `0 0 ${sz(u, 14)}px`, textAlign: "center", fontFamily: u.FONT_B }}>{t.titre}</p>}
      <div style={{ display: "flex", gap: sz(u, 8), flexWrap: compact ? "wrap" : "nowrap" }}>
        {t.formules.map((f, i) => (
          <div key={i} style={{ flex: 1, minWidth: sz(u, 90), background: f.vedette ? `${u.G}12` : u.FILL, border: `1.5px solid ${f.vedette ? `${u.G}50` : u.LINE}`, borderRadius: 13, padding: `${sz(u, 14)}px ${sz(u, 10)}px`, position: "relative", textAlign: "center" }}>
            {f.vedette && !compact && <div style={{ position: "absolute", top: -sz(u, 9), left: "50%", transform: "translateX(-50%)", background: u.G, color: "#080808", borderRadius: 20, padding: `${sz(u, 2)}px ${sz(u, 10)}px`, fontSize: sz(u, 9), fontWeight: 700, whiteSpace: "nowrap", fontFamily: u.FONT_B }}>⭐ Populaire</div>}
            <p style={{ color: f.vedette ? u.G : u.TEXT, fontSize: sz(u, 12), fontWeight: 700, margin: `0 0 ${sz(u, 5)}px`, fontFamily: u.FONT_B, textTransform: compact ? "uppercase" : undefined, letterSpacing: compact ? 1 : undefined }}>{f.nom}</p>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", margin: `0 0 ${sz(u, 9)}px` }}>
              {f.prix && <p style={{ color: u.G, fontSize: sz(u, 19), fontWeight: 700, margin: 0, fontFamily: u.FONT_D }}>{f.prix}</p>}
              {f.ancienPrix && <p style={{ margin: `${sz(u, 2)}px 0 0`, fontSize: sz(u, 11), fontFamily: u.FONT_B }}>
                <span style={{ color: u.MUTED, textDecoration: "line-through" }}>{f.ancienPrix}</span>
                {f.remise && <span style={{ color: "#EF4444", fontWeight: 800, marginLeft: sz(u, 4) }}>{f.remise.label}</span>}
              </p>}
            </div>
            {f.description && <p style={{ color: u.MUTED, fontSize: sz(u, 13.5), margin: 0, fontFamily: u.FONT_B }}>{f.description}</p>}
            {f.lignes.map((l, j) => (
              <p key={j} style={{ color: u.MUTED, fontSize: sz(u, 12), margin: `0 0 ${sz(u, 4)}px`, display: "flex", gap: sz(u, 5), textAlign: "left", fontFamily: u.FONT_B }}><span aria-hidden style={{ color: "var(--success)" }}>✓</span> {l}</p>
            ))}
          </div>
        ))}
      </div>
      {t.cta && (u.mode === "public"
        ? <PublicCtaLink href={t.cta.href} external={/^https?:/i.test(t.cta.href)} trackTarget={t.cta.href} trackClick={u.trackClick} style={bouton}>{t.cta.label}</PublicCtaLink>
        : <EditorCtaShell style={bouton}>{t.cta.label}</EditorCtaShell>)}
    </div>
  )
}
