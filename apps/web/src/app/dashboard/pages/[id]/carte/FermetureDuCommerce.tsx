"use client"

// Horaires et fermetures, dans « Ma carte » (vague 1, revue du 23 nov.).
//  · « Fermé aujourd'hui » : un toucher, le badge de la page dit
//    « Fermé · réouverture le … » et s'éteint seul demain.
//  · « Annoncer des congés » : premier et dernier jour fermés, au calendrier.
//  · « Rouvrir » efface l'annonce.
// La phrase écrite est celle que lib/congesDates relit (fermetureDuCommerce).

import { useState } from "react"
import { Button, ButtonLink } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { useToast } from "@/components/Toast"
import { propsAnnonce } from "@/lib/annonceAuLecteur"
import type { FermetureVue } from "@/app/dashboard/builder/shared-renderer/models/fermetureDuCommerce"

type Reponse = { ok: true; fermeture: FermetureVue } | { ok: false; phrase: string }
export type ActionsFermeture = {
  annoncer: (debut: string, fin: string | null) => Promise<Reponse>
  rouvrir: () => Promise<Reponse>
}

const MUTED = "var(--muted)"

export function FermetureDuCommerce({ fermeture: depart, actions, lienEditeur }: { fermeture: FermetureVue | null; actions: ActionsFermeture; lienEditeur: string }) {
  const toast = useToast()
  const [f, setF] = useState(depart)
  const [ouvert, setOuvert] = useState(false)
  const [debut, setDebut] = useState(depart?.aujourdhui ?? "")
  const [fin, setFin] = useState(depart?.aujourdhui ?? "")
  const [envoi, setEnvoi] = useState<null | "jour" | "conges" | "rouvrir">(null)
  const [refus, setRefus] = useState("")

  // Sans horaires, rien à fermer : on dit où les ajouter, en une ligne.
  if (!f) return (
    <section className="qd-carte" aria-labelledby="fermeture-titre" style={{ margin: "0 0 16px", padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
      <h2 id="fermeture-titre" style={{ flex: 1, minWidth: 180, margin: 0, fontSize: 14, fontWeight: 600, color: MUTED }}>Fermetures : ajoutez d&apos;abord vos horaires à la page.</h2>
      <ButtonLink href={lienEditeur} size="sm" variant="ghost">Ajouter mes horaires</ButtonLink>
    </section>
  )

  async function agir(quoi: "jour" | "conges" | "rouvrir") {
    if (envoi) return
    setEnvoi(quoi); setRefus("")
    const issue = await (quoi === "rouvrir" ? actions.rouvrir() : quoi === "jour" ? actions.annoncer(f!.aujourdhui, null) : actions.annoncer(debut, fin || null))
      .catch(() => ({ ok: false as const, phrase: "La fermeture n'a pas pu être enregistrée. Réessayez." }))
    setEnvoi(null)
    if (!issue.ok) { setRefus(issue.phrase); if (quoi !== "conges") toast.error(issue.phrase); return }
    setF(issue.fermeture); setOuvert(false)
    toast.success(quoi === "rouvrir" ? "Annonce de fermeture retirée" : issue.fermeture.etat === "pendant" ? "Votre page indique que vous êtes fermé" : "Fermeture annoncée sur votre page")
  }

  const annonce = f.etat === "pendant" || f.etat === "avant" || (f.etat === "aucune" && !!f.message)
  return (
    <section className="qd-carte" aria-labelledby="fermeture-titre" data-fermeture-etat={f.etat} style={{ margin: "0 0 16px", overflow: "hidden" }}>
      <div style={{ padding: "14px 16px 12px", display: "flex", flexDirection: "column", gap: 10 }}>
        <div>
          <h2 id="fermeture-titre" style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "var(--ink)" }}>Fermetures</h2>
          <p role="status" style={{ margin: "3px 0 0", fontSize: 13, lineHeight: 1.45, fontWeight: 600, color: f.etat === "pendant" ? "var(--warning)" : annonce ? "var(--ink)" : MUTED }}>{f.phrase}</p>
        </div>
        {!ouvert && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {f.etat !== "pendant" && <Button size="sm" variant="secondary" loading={envoi === "jour"} onClick={() => agir("jour")}>Fermé aujourd&apos;hui</Button>}
            <Button size="sm" variant="ghost" onClick={() => { setDebut(f.aujourdhui); setFin(f.aujourdhui); setRefus(""); setOuvert(true) }}>Annoncer des congés</Button>
            {annonce && <Button size="sm" variant="ghost" loading={envoi === "rouvrir"} onClick={() => agir("rouvrir")}>{f.etat === "pendant" ? "Rouvrir maintenant" : "Retirer l'annonce"}</Button>}
          </div>
        )}
      </div>
      {ouvert && (
        <form aria-label="Annoncer des congés" onSubmit={e => { e.preventDefault(); agir("conges") }}
          style={{ display: "flex", flexDirection: "column", gap: 10, padding: "12px 16px 14px", borderTop: "1px solid var(--line)", background: "var(--surface-2)" }}>
          {/* Un champ date ne descend pas sous ~170 px : au téléphone, les deux s'empilent. */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 10 }}>
            <Input type="date" label="Premier jour fermé" value={debut} min={f.aujourdhui} onChange={e => { setDebut(e.target.value); if (fin < e.target.value) setFin(e.target.value) }} />
            <Input type="date" label="Dernier jour fermé" value={fin} min={debut || f.aujourdhui} onChange={e => setFin(e.target.value)} />
          </div>
          {refus && <p {...propsAnnonce("erreur")} style={{ margin: 0, color: "var(--danger)", fontSize: 13 }}>{refus}</p>}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
            <Button type="button" variant="ghost" size="sm" onClick={() => { setOuvert(false); setRefus("") }}>Annuler</Button>
            <Button type="submit" size="sm" loading={envoi === "conges"} disabled={!debut}>Annoncer</Button>
          </div>
        </form>
      )}
    </section>
  )
}
