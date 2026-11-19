"use client"
// wifi — la vue (19 nov.). Hors de la page publiée, tout est DESSINÉ, rien n'est
// branché. Contrôles stylés par classes (.wifi-*), couleurs du commerçant en
// variables posées une fois sur le bloc.

import { useState } from "react"
import { wifiDuBloc, masquer } from "../../models/wifi"
import type { UnifiedCtx } from "../../renderTypes"

export function WifiVue({ content: c, u }: { content: Record<string, any>; u: UnifiedCtx }) {
  const w = wifiDuBloc(c)!
  const publicMode = u.mode === "public"
  const [visible, setVisible] = useState(false)
  const [copie, setCopie] = useState(false)
  const copier = async () => {
    try { await navigator.clipboard.writeText(w.motDePasse); setCopie(true); setTimeout(() => setCopie(false), 2500) } catch { setVisible(true) }
  }
  const ligne = (etiquette: string, valeur: React.ReactNode) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
      <span style={{ color: u.MUTED, fontSize: 12, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", fontFamily: u.FONT_B }}>{etiquette}</span>
      <span style={{ color: u.TEXT, fontSize: 18, fontWeight: 700, fontFamily: u.FONT_B, overflowWrap: "anywhere" }}>{valeur}</span>
    </div>
  )
  return (
    <section data-wifi="" style={{
      padding: `${Math.round(12 * u.scale)}px 16px`,
      ["--reseau-texte" as string]: u.TEXT, ["--reseau-ligne" as string]: u.LINE_STRONG, ["--reseau-police" as string]: u.FONT_B, ["--reseau-accent" as string]: u.G,
    }}>
      <div style={{ background: u.FILL, border: `1px solid ${u.LINE}`, borderRadius: 16, padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        <p style={{ margin: 0, display: "flex", alignItems: "center", gap: 8, color: u.TEXT, fontSize: 17, fontWeight: 800, fontFamily: u.FONT_D }}>
          <span aria-hidden="true">📶</span>{c.title || "Wi-Fi"}
        </p>
        {ligne("Réseau", w.reseau)}
        {w.ouvert
          ? <p style={{ margin: 0, color: u.MUTED, fontSize: 14, fontFamily: u.FONT_B }}>Réseau ouvert, sans mot de passe.</p>
          : (
            <>
              {ligne("Mot de passe", <span data-mot-de-passe="" style={{ fontFamily: visible ? "ui-monospace, monospace" : u.FONT_B, letterSpacing: visible ? 0 : 2 }}>{visible ? w.motDePasse : masquer(w.motDePasse)}</span>)}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {publicMode ? (
                  <>
                    <button type="button" className="reseau-bouton reseau-bouton--plein" onClick={copier}>{copie ? "✓ Copié" : "Copier le mot de passe"}</button>
                    <button type="button" className="reseau-bouton" aria-pressed={visible} onClick={() => setVisible(v => !v)}>{visible ? "Masquer" : "Afficher"}</button>
                  </>
                ) : (
                  <span aria-hidden="true" className="reseau-bouton reseau-bouton--plein">Copier le mot de passe</span>
                )}
              </div>
              <span role="status" aria-live="polite" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>{copie ? "Mot de passe copié" : ""}</span>
            </>
          )}
        {w.note && <p style={{ margin: 0, color: u.MUTED, fontSize: 13, fontFamily: u.FONT_B }}>{w.note}</p>}
      </div>
    </section>
  )
}
