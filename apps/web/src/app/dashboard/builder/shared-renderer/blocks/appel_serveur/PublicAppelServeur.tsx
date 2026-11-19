"use client"
// appel_serveur — la vue (lot fast-food 2, 19 nov.). Le client, à table, choisit
// sa demande ; elle part par /api/leads et arrive dans Messages. Hors de la page
// publiée (éditeur, miniature), tout est DESSINÉ, rien n'est branché.
//
// Les contrôles portent des classes (.appel-*, globals.css) ; les couleurs du
// commerçant passent en variables posées une fois sur le bloc.

import { useEffect, useState } from "react"
import { submitLead } from "@/lib/submitLead"
import {
  demandesActives, tableDepuisAdresse, normaliserTable, contenuDeLAppel, secondesRestantes,
  TYPE_APPEL, type Demande,
} from "../../models/appelServeur"
import type { UnifiedCtx } from "../../renderTypes"

type Etat = { phase: "repos" } | { phase: "envoi"; cle: string } | { phase: "envoye"; demande: string; table: string } | { phase: "erreur" } | { phase: "apercu" }

export function AppelServeurVue({ content: c, u, pageId, blockId }: { content: Record<string, any>; u: UnifiedCtx; pageId: string; blockId: string }) {
  const publicMode = u.mode === "public"
  const demandes = demandesActives(c)
  const demanderTable = String(c.ask_table || "Oui") !== "Non"
  const [table, setTable] = useState("")
  const [etat, setEtat] = useState<Etat>({ phase: "repos" })
  const [dernier, setDernier] = useState<number | null>(null)
  const [maintenant, setMaintenant] = useState(0)

  // Le QR collé sur la table porte son numéro : `?table=12`.
  useEffect(() => { if (publicMode) setTable(t => t || tableDepuisAdresse(window.location.search)) }, [publicMode])
  // L'horloge de la pause ne tourne que pendant une pause.
  useEffect(() => {
    if (dernier == null) return
    setMaintenant(Date.now())
    const t = setInterval(() => setMaintenant(Date.now()), 1000)
    return () => clearInterval(t)
  }, [dernier])
  const pause = secondesRestantes(dernier, maintenant || Date.now())

  const envoyer = async (d: Demande) => {
    if (!publicMode || etat.phase === "envoi" || pause > 0) return
    // L'aperçu d'un modèle rend la page « comme en ligne », mais sans page réelle :
    // un appui n'y envoie rien, et le dit.
    if (!/^[0-9a-f-]{36}$/i.test(pageId)) { setEtat({ phase: "apercu" }); return }
    setEtat({ phase: "envoi", cle: d.cle })
    const appel = contenuDeLAppel(d, table)
    const ok = await submitLead({ pageId, blockId, type: TYPE_APPEL, name: appel.name, message: appel.message, data: appel.data })
    if (!ok) { setEtat({ phase: "erreur" }); return }
    setDernier(Date.now())
    setEtat({ phase: "envoye", demande: d.libelle, table: normaliserTable(table) })
  }

  return (
    <section data-appel-serveur="" style={{
      padding: `${Math.round(14 * u.scale)}px 16px`,
      ["--appel-texte" as string]: u.TEXT, ["--appel-ligne" as string]: u.LINE_STRONG, ["--appel-fond" as string]: u.FILL,
      ["--appel-police" as string]: u.FONT_B, ["--appel-accent" as string]: u.G, ["--appel-discret" as string]: u.MUTED,
    }}>
      <div style={{ background: u.FILL, border: `1px solid ${u.LINE}`, borderRadius: 16, padding: 16 }}>
        <p style={{ margin: 0, color: u.TEXT, fontSize: 18, fontWeight: 800, fontFamily: u.FONT_D }}>{c.title || "Besoin de nous ?"}</p>
        {c.subtitle && <p style={{ margin: "4px 0 0", color: u.MUTED, fontSize: 13, fontFamily: u.FONT_B }}>{c.subtitle}</p>}

        {demanderTable && (
          publicMode
            ? <label className="appel-table">
                <span>Table n°</span>
                <input type="text" inputMode="numeric" autoComplete="off" aria-label="Numéro de table"
                  className="appel-champ" value={table} placeholder="12" onChange={e => setTable(normaliserTable(e.target.value))} />
              </label>
            : <div aria-hidden="true" className="appel-table"><span>Table n°</span><span className="appel-champ">12</span></div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
          {demandes.map(d => {
            const enCours = etat.phase === "envoi" && etat.cle === d.cle
            const contenu = <><span aria-hidden="true">{d.icone}</span>{enCours ? "Envoi…" : d.libelle}</>
            return publicMode
              ? <button key={d.cle} type="button" className="appel-bouton" data-demande={d.cle}
                  disabled={etat.phase === "envoi" || pause > 0} onClick={() => envoyer(d)}>{contenu}</button>
              : <span key={d.cle} className="appel-bouton">{contenu}</span>
          })}
        </div>

        <div role="status" aria-live="polite" style={{ marginTop: 10, minHeight: 20, fontFamily: u.FONT_B, fontSize: 14 }}>
          {etat.phase === "envoye" && (
            <p style={{ margin: 0, color: u.TEXT }}>
              ✓ « {etat.demande} » envoyé à l&apos;équipe{etat.table ? ` — table ${etat.table}` : ""}.
              {pause > 0 && <span style={{ color: u.MUTED }}> Nouvel appel possible dans {pause} s.</span>}
            </p>
          )}
          {etat.phase === "apercu" && (
            <p style={{ margin: 0, color: u.MUTED }}>Aperçu : rien n&apos;est envoyé. Sur votre page en ligne, la demande arrive dans Messages.</p>
          )}
          {etat.phase === "erreur" && (
            <p style={{ margin: 0, color: u.lisible("#EF4444", 4.5) }}>L&apos;envoi n&apos;a pas abouti. Réessayez, ou faites signe à l&apos;équipe.</p>
          )}
        </div>
      </div>
    </section>
  )
}
