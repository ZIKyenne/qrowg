"use client"
// infos_sejour — la vue (livret d'accueil, 19 nov.). Arrivée / départ, accès,
// code (masqué, « Afficher »), règles, « avant de partir ». Hors de la page
// publiée, rien n'est branché.

import { useState } from "react"
import { infosSejour } from "../../models/livretAccueil"
import { masquer } from "../../models/wifi"
import type { UnifiedCtx } from "../../renderTypes"

export function InfosSejourVue({ content: c, u }: { content: Record<string, any>; u: UnifiedCtx }) {
  const i = infosSejour(c)!
  const publicMode = u.mode === "public"
  const [visible, setVisible] = useState(false)
  const s = (n: number) => Math.round(n * u.scale)
  const titreDeSection = (t: string) => <h3 style={{ margin: `${s(4)}px 0 ${s(6)}px`, color: u.MUTED, fontSize: s(12), fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", fontFamily: u.FONT_B }}>{t}</h3>
  const tuile = (etiquette: string, valeur: string) => (
    <div style={{ flex: "1 1 140px", background: u.FILL, border: `1px solid ${u.LINE}`, borderRadius: 14, padding: s(12) }}>
      <p style={{ margin: 0, color: u.MUTED, fontSize: s(12), fontWeight: 700, fontFamily: u.FONT_B }}>{etiquette}</p>
      <p style={{ margin: `${s(2)}px 0 0`, color: u.TEXT, fontSize: s(18), fontWeight: 800, fontFamily: u.FONT_D }}>{valeur}</p>
    </div>
  )
  return (
    <section data-infos-sejour="" style={{
      padding: `${s(12)}px 16px`, display: "flex", flexDirection: "column", gap: s(12),
      ["--reseau-texte" as string]: u.TEXT, ["--reseau-ligne" as string]: u.LINE_STRONG, ["--reseau-police" as string]: u.FONT_B, ["--reseau-accent" as string]: u.G,
    }}>
      <h2 style={{ margin: 0, color: u.TEXT, fontSize: s(22), fontWeight: 800, fontFamily: u.FONT_D }}>{c.title || "Votre séjour"}</h2>
      {(i.arrivee || i.depart) && (
        <div style={{ display: "flex", gap: s(10), flexWrap: "wrap" }}>
          {i.arrivee && tuile("Arrivée", i.arrivee)}
          {i.depart && tuile("Départ", i.depart)}
        </div>
      )}
      {i.acces && <div>{titreDeSection("Accès")}<p style={{ margin: 0, color: u.TEXT, fontSize: s(15), lineHeight: 1.55, fontFamily: u.FONT_B, whiteSpace: "pre-line" }}>{i.acces}</p></div>}
      {i.code && (
        <div>
          {titreDeSection(c.code_label || "Code")}
          <div style={{ display: "flex", alignItems: "center", gap: s(10), flexWrap: "wrap" }}>
            <span data-code="" style={{ color: u.TEXT, fontSize: s(22), fontWeight: 800, letterSpacing: visible ? 2 : 4, fontFamily: visible ? "ui-monospace, monospace" : u.FONT_B }}>
              {visible ? i.code : masquer(i.code)}
            </span>
            {publicMode
              ? <button type="button" className="reseau-bouton" aria-pressed={visible} onClick={() => setVisible(v => !v)}>{visible ? "Masquer" : "Afficher le code"}</button>
              : <span aria-hidden="true" className="reseau-bouton">Afficher le code</span>}
          </div>
        </div>
      )}
      {i.regles.length > 0 && (
        <div>
          {titreDeSection("Règles de la maison")}
          <ul style={{ margin: 0, paddingInlineStart: s(18), color: u.TEXT, fontSize: s(15), lineHeight: 1.6, fontFamily: u.FONT_B }}>
            {i.regles.map((r, k) => <li key={k}>{r}</li>)}
          </ul>
        </div>
      )}
      {i.avantDepart.length > 0 && (
        <div>
          {titreDeSection("Avant de partir")}
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: s(6) }}>
            {i.avantDepart.map((r, k) => (
              <li key={k} style={{ display: "flex", gap: s(8), color: u.TEXT, fontSize: s(15), fontFamily: u.FONT_B }}>
                <span aria-hidden="true" style={{ color: u.G }}>☐</span>{r}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
