"use client"
// creneaux_du_jour — la vue (beauté, 19 nov.). Chaque créneau encore à venir est
// un bouton : appel, WhatsApp prérempli ou lien de réservation. Recalculé chaque
// minute : un créneau passé disparaît sous les yeux du client. Hors de la page
// publiée, rien n'est branché.

import { useALaMinute } from "../../primitives/instantDuRendu"
import { creneauxRestants, lireCreneaux, heureLisible, messageDeCreneau } from "../../models/momentDuSalon"
import { telLink, waLink, destinationUtile } from "../../../types"
import type { UnifiedCtx } from "../../renderTypes"

export function lienDuCreneau(c: Record<string, any>, m: number): string | null {
  const action = String(c.action || "Appeler")
  if (action === "WhatsApp") return waLink(c.phone, messageDeCreneau(m), c.country_code || "33") || null  // numéro national → indicatif (comme le contact)
  if (action === "Lien de réservation") return c.url ? destinationUtile(String(c.url)) : null
  return telLink(c.phone) || null
}

export function CreneauxVue({ content: c, u, creneaux }: { content: Record<string, any>; u: UnifiedCtx; creneaux: number[] }) {
  const publicMode = u.mode === "public"
  const s = (n: number) => Math.round(n * u.scale)
  return (
    <section data-creneaux="" style={{
      padding: `${s(12)}px 16px`,
      ["--reseau-texte" as string]: u.TEXT, ["--reseau-ligne" as string]: u.LINE_STRONG, ["--reseau-police" as string]: u.FONT_B, ["--reseau-accent" as string]: u.G,
    }}>
      <div style={{ background: u.FILL, border: `1px solid ${u.LINE_STRONG}`, borderRadius: 16, padding: s(16), display: "flex", flexDirection: "column", gap: s(10) }}>
        <h2 style={{ margin: 0, color: u.TEXT, fontSize: s(20), fontWeight: 800, fontFamily: u.FONT_D }}>{c.title || "Créneaux libres aujourd'hui"}</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: s(8) }}>
          {creneaux.map(m => {
            const href = lienDuCreneau(c, m)
            const externe = String(c.action || "") !== "Appeler"
            return publicMode && href
              ? <a key={m} className="reseau-bouton reseau-bouton--plein" data-creneau={m} href={href}
                  {...(externe ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  aria-label={`Réserver le créneau de ${heureLisible(m)}`} onClick={() => u.trackClick(`creneau:${m}`)}>{heureLisible(m)}</a>
              : <span key={m} className="reseau-bouton reseau-bouton--plein" data-creneau={m}>{heureLisible(m)}</span>
          })}
        </div>
        {c.note && <p style={{ margin: 0, color: u.MUTED, fontSize: s(13), fontFamily: u.FONT_B }}>{c.note}</p>}
      </div>
    </section>
  )
}

/** En ligne : décidé au rendu, revérifié au montage puis chaque minute. */
export function CreneauxEnLigne({ content: c, u }: { content: Record<string, any>; u: UnifiedCtx }) {
  const restants = useALaMinute(now => creneauxRestants(c, now), [c])
  if (restants.length === 0) return null
  return <CreneauxVue content={c} u={u} creneaux={restants} />
}

/** L'éditeur montre TOUTE la liste saisie (le commerçant voit ce qu'il a écrit). */
export const tousLesCreneaux = (c: Record<string, any>) => lireCreneaux(c?.creneaux)
