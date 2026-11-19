"use client"
// commande_retrait — la vue (proximité, 19 nov.). Le client choisit ses quantités,
// ajoute une précision (heure de retrait, nom) ; le bouton ouvre WhatsApp ou les
// SMS avec la commande ÉCRITE. Aucun paiement, aucun serveur : le commerçant
// reçoit un message, il répond comme d'habitude. Le total est dit « estimé ».
// Hors de la page publiée (éditeur, miniatures), rien n'est branché.

import { useState } from "react"
import { lireArticles, totalEstime, messageDeCommande, eurosLisibles, QUANTITE_MAX, type Panier } from "../../models/commerceDeProximite"
import { waLink } from "../../../types"
import { chiffresDuNumero } from "@/lib/lienDeContact"
import { limite } from "@/lib/limitesDeSaisie"
import type { UnifiedCtx } from "../../renderTypes"

export function lienDeCommande(c: Record<string, any>, message: string): string | null {
  if (String(c.canal || "WhatsApp") === "SMS") {
    const n = chiffresDuNumero(c.phone)
    return n ? `sms:${String(c.phone || "").trim().startsWith("+") ? "+" : ""}${n}?&body=${encodeURIComponent(message)}` : null
  }
  return waLink(c.phone, message, c.country_code || "33") || null
}

export function CommandeVue({ content: c, u }: { content: Record<string, any>; u: UnifiedCtx }) {
  const publicMode = u.mode === "public"
  const s = (n: number) => Math.round(n * u.scale)
  const articles = lireArticles(c.articles)
  const [panier, setPanier] = useState<Panier>({})
  const [precisions, setPrecisions] = useState("")
  const qte = (rang: number) => panier[rang] ?? 0
  const changer = (rang: number, d: number) => setPanier(p => ({ ...p, [rang]: Math.max(0, Math.min(QUANTITE_MAX, (p[rang] ?? 0) + d)) }))
  const nb = Object.values(panier).reduce((a, b) => a + b, 0)
  const total = totalEstime(articles, panier)
  const message = messageDeCommande(articles, panier, precisions)
  const href = nb > 0 ? lienDeCommande(c, message) : null
  const canal = String(c.canal || "WhatsApp") === "SMS" ? "par SMS" : "par WhatsApp"

  return (
    <section data-commande="" style={{
      padding: `${s(12)}px 16px`,
      ["--panier-texte" as string]: u.TEXT, ["--panier-ligne" as string]: u.LINE_STRONG, ["--panier-police" as string]: u.FONT_B,
      ["--panier-accent" as string]: u.G, ["--panier-fond" as string]: u.FILL,
      ["--reseau-texte" as string]: u.TEXT, ["--reseau-ligne" as string]: u.LINE_STRONG, ["--reseau-police" as string]: u.FONT_B, ["--reseau-accent" as string]: u.G,
    }}>
      <div style={{ background: u.FILL, border: `1px solid ${u.LINE_STRONG}`, borderRadius: 16, padding: s(16), display: "flex", flexDirection: "column", gap: s(10) }}>
        <h2 style={{ margin: 0, color: u.TEXT, fontSize: s(20), fontWeight: 800, fontFamily: u.FONT_D }}>{c.title || "Commander à retirer"}</h2>
        {c.retrait && <p style={{ margin: 0, color: u.MUTED, fontSize: s(13), fontFamily: u.FONT_B }}>{c.retrait}</p>}
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {articles.map((a, i) => (
            <li key={a.rang} data-article={a.rang} style={{ display: "flex", alignItems: "center", gap: s(10), padding: `${s(8)}px 0`, borderTop: i ? `1px solid ${u.LINE}` : "none", fontFamily: u.FONT_B }}>
              <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
                <span style={{ color: u.TEXT, fontSize: s(15), fontWeight: 600 }}>{a.nom}</span>
                {a.prix && <span style={{ color: u.MUTED, fontSize: s(13) }}>{a.prix}</span>}
              </span>
              {publicMode ? (
                <span className="panier-quantite">
                  <button type="button" className="panier-pas" aria-label={`Retirer un ${a.nom}`} disabled={qte(a.rang) === 0} onClick={() => changer(a.rang, -1)}>−</button>
                  <output className="panier-nombre" aria-live="polite" aria-label={`Quantité de ${a.nom}`}>{qte(a.rang)}</output>
                  <button type="button" className="panier-pas" aria-label={`Ajouter un ${a.nom}`} disabled={qte(a.rang) >= QUANTITE_MAX} onClick={() => changer(a.rang, 1)}>+</button>
                </span>
              ) : (
                <span aria-hidden="true" className="panier-quantite"><span className="panier-pas">−</span><span className="panier-nombre">0</span><span className="panier-pas">+</span></span>
              )}
            </li>
          ))}
        </ul>
        {publicMode
          ? <label style={{ display: "flex", flexDirection: "column", gap: s(6), color: u.MUTED, fontSize: s(13), fontFamily: u.FONT_B }}>
              Précisions (heure de retrait, nom…)
              <textarea className="panier-champ" rows={2} value={precisions} maxLength={limite("precisionsDeCommande")} onChange={e => setPrecisions(e.target.value)} placeholder="Retrait vers 17 h, au nom de…" />
            </label>
          : <span aria-hidden="true" className="panier-champ" style={{ color: u.MUTED }}>Précisions (heure de retrait, nom…)</span>}
        {total !== null && <p data-total="" style={{ margin: 0, color: u.TEXT, fontSize: s(15), fontWeight: 700, fontFamily: u.FONT_B }}>Total estimé : {eurosLisibles(total)}</p>}
        {publicMode && href
          ? <a className="reseau-bouton reseau-bouton--plein" href={href} target="_blank" rel="noopener noreferrer" onClick={() => u.trackClick("commande")}>Envoyer la commande {canal}</a>
          : <span className="reseau-bouton" aria-disabled="true" style={{ opacity: .6 }}>{nb > 0 ? `Envoyer la commande ${canal}` : "Choisissez au moins un article"}</span>}
        {c.note && <p style={{ margin: 0, color: u.MUTED, fontSize: s(13), fontFamily: u.FONT_B }}>{c.note}</p>}
      </div>
    </section>
  )
}
