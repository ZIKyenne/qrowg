"use client"
// planning_cours — le planning de la semaine (sport, coach, studio — 20 nov.).
// Le prochain cours en tête, à l'heure du commerce, recalculé chaque minute ;
// le jour même marqué « Aujourd'hui » ; un cours « complet » n'a pas de bouton.
// Hors de la page publiée (éditeur, miniatures), rien n'est branché.

import { useALaMinute } from "../../primitives/instantDuRendu"
import { etatPlanning, quandLisible, messageDeCours, NOMS_JOURS, type EtatPlanning, type Cours } from "../../models/planningEtProgramme"
import { telLink, waLink, destinationUtile } from "../../../types"
import { editorCtx, publicCtx, type UnifiedCtx, type EditorAdapterProps, type PublicAdapterProps } from "../../renderTypes"
import { BlockEmptyState } from "../../primitives/BlockEmptyState"

export function lienDeCours(c: Record<string, any>, cours: Cours): string | null {
  const action = String(c.action || "Aucune")
  if (action === "WhatsApp") return waLink(c.phone, messageDeCours(cours), c.country_code || "33") || null
  if (action === "Lien de réservation") return c.url ? destinationUtile(String(c.url)) : null
  if (action === "Appeler") return telLink(c.phone) || null
  return null
}

function Vue({ c, u, e }: { c: Record<string, any>; u: UnifiedCtx; e: EtatPlanning }) {
  const publicMode = u.mode === "public"
  const s = (n: number) => Math.round(n * u.scale)
  const accent = u.lisible(u.G, 4.5)
  return (
    <section data-planning="" style={{
      padding: `${s(12)}px 16px`,
      ["--reseau-texte" as string]: u.TEXT, ["--reseau-ligne" as string]: u.LINE_STRONG, ["--reseau-police" as string]: u.FONT_B, ["--reseau-accent" as string]: u.G,
    }}>
      <div style={{ background: u.FILL, border: `1px solid ${u.LINE_STRONG}`, borderRadius: 16, padding: s(16), display: "flex", flexDirection: "column", gap: s(12) }}>
        <h2 style={{ margin: 0, color: u.TEXT, fontSize: s(20), fontWeight: 800, fontFamily: u.FONT_D }}>{c.title || "Planning des cours"}</h2>
        {e.prochain && (
          <p data-prochain-cours="" suppressHydrationWarning style={{ margin: 0, color: accent, fontSize: s(15), fontWeight: 700, fontFamily: u.FONT_B }}>
            Prochain cours : {e.prochain.cours.nom} — {quandLisible(e.prochain)}
          </p>
        )}
        {e.groupes.map(g => {
          const auj = g.jour === e.aujourdhui
          return (
            <div key={g.jour} data-jour={g.jour} style={{ display: "flex", flexDirection: "column" }}>
              <h3 style={{ margin: `0 0 ${s(4)}px`, display: "flex", alignItems: "center", gap: s(8), color: auj ? u.TEXT : u.MUTED, fontSize: s(13), fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase", fontFamily: u.FONT_B }}>
                {NOMS_JOURS[g.jour]}
                {auj && <span suppressHydrationWarning style={{ padding: `${s(2)}px ${s(8)}px`, borderRadius: 999, border: `1px solid ${accent}`, color: accent, fontSize: s(11), letterSpacing: ".04em" }}>Aujourd'hui</span>}
              </h3>
              <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                {g.cours.map(co => {
                  const href = publicMode && !co.complet ? lienDeCours(c, co) : null
                  const externe = String(c.action || "") !== "Appeler"
                  return (
                    <li key={co.rang} data-cours={co.rang} style={{ display: "flex", alignItems: "center", gap: s(12), padding: `${s(8)}px 0`, borderTop: `1px solid ${u.LINE}`, fontFamily: u.FONT_B }}>
                      <span style={{ minWidth: s(52), color: u.TEXT, fontSize: s(15), fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{co.heure}</span>
                      <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
                        <span style={{ color: co.complet ? u.MUTED : u.TEXT, fontSize: s(15), fontWeight: 600 }}>{co.nom}</span>
                        {co.details && <span style={{ color: u.MUTED, fontSize: s(13) }}>{co.details}</span>}
                      </span>
                      {co.complet
                        ? <span data-complet="" style={{ color: u.MUTED, fontSize: s(12), fontWeight: 700, whiteSpace: "nowrap" }}>Complet</span>
                        : href && <a className="reseau-bouton" href={href} {...(externe ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                            aria-label={`Réserver : ${co.nom}, ${NOMS_JOURS[co.jour].toLowerCase()} à ${co.heure}`} onClick={() => u.trackClick(`cours:${co.rang}`)}>Réserver</a>}
                    </li>
                  )
                })}
              </ul>
            </div>
          )
        })}
        {c.note && <p style={{ margin: 0, color: u.MUTED, fontSize: s(13), fontFamily: u.FONT_B }}>{c.note}</p>}
      </div>
    </section>
  )
}

export function EditorPlanningCours({ content, ctx }: EditorAdapterProps) {
  const u = editorCtx(ctx)
  const e = etatPlanning(content, new Date())
  if (!e.groupes.length) return <div style={{ padding: "10px 16px" }}><BlockEmptyState icon="🗓️" label="Indiquez vos cours de la semaine" sub="Une ligne par cours : « Mar 18h30 Yoga · 60 min »" muted={u.MUTED} /></div>
  return <Vue c={content} u={u} e={e} />
}

export function PublicPlanningCours({ content, ctx }: PublicAdapterProps) {
  const c = content || {}
  const e = useALaMinute<EtatPlanning>(now => etatPlanning(c, now), [c])
  if (!e.groupes.length) return null
  return <Vue c={c} u={publicCtx(ctx)} e={e} />
}
