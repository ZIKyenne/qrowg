"use client"
// EditeurDuMoment — l'éditeur des blocs « du moment » (beauté, 19 nov.) :
//  · créneaux du jour : modifier la liste la DATE du jour (comme l'ardoise) ;
//  · attente en direct : choisir l'attente l'HORODATE ; « Toujours d'actualité »
//    la renouvelle sans rien changer.
//  · arrivage (proximité, 19 nov.) : modifier la liste la DATE du jour ; elle
//    reste en ligne pendant la durée choisie.
// Un bandeau dit, dans chaque cas, ce qui se voit en ligne MAINTENANT.
// Composants communs uniquement (Reglage, .ui-input, .ui-select, Button).

import { Button } from "@/components/ui/Button"
import { Reglage } from "@/components/ui/Reglage"
import type { Block } from "./types"
import { jourDuCommerce, jourLisible } from "./shared-renderer/models/platDuJour"
import { creneauxRestants, lireCreneaux, attenteActuelle, depuisLisible, ATTENTES, ACTIONS_CRENEAU } from "./shared-renderer/models/momentDuSalon"
import { etatArrivage, arriveLisible, DUREES_ARRIVAGE } from "./shared-renderer/models/commerceDeProximite"

const etiquette = { color: "var(--muted)", fontSize: 11, display: "block", marginBottom: 5, fontWeight: 500 } as const

export function EditeurDuMoment({ block, onChange }: { block: Block; onChange: (key: string, val: string) => void }) {
  const c = block.content as Record<string, any>
  const champ = (cle: string, nom: string, placeholder = "", apres?: () => void) => (
    <Reglage nom={nom} style={etiquette}>{id => (
      <input id={id} className="ui-input" value={c[cle] || ""} placeholder={placeholder}
        onChange={e => { onChange(cle, e.target.value); apres?.() }} />
    )}</Reglage>
  )
  const choix = (cle: string, nom: string, options: readonly string[], apres?: () => void) => (
    <Reglage nom={nom} style={etiquette}>{id => (
      <select id={id} aria-label={nom} className="ui-select" value={c[cle] || ""} onChange={e => { onChange(cle, e.target.value); apres?.() }}>
        <option value="">—</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    )}</Reglage>
  )
  const bandeau = (enLigne: boolean, texte: string, bouton?: { libelle: string; agir: () => void }) => (
    <div role="status" data-etat-moment={enLigne ? "en-ligne" : "masque"} style={{
      display: "flex", flexDirection: "column", gap: 8, padding: 12, borderRadius: 12,
      border: `1px solid ${enLigne ? "var(--line)" : "color-mix(in srgb, var(--warning) 45%, transparent)"}`,
      background: enLigne ? "transparent" : "color-mix(in srgb, var(--warning) 10%, transparent)",
    }}>
      <p style={{ margin: 0, color: enLigne ? "var(--success)" : "var(--warning)", fontSize: 13, fontWeight: 700 }}>{texte}</p>
      {bouton && <Button type="button" size="sm" onClick={bouton.agir}>{bouton.libelle}</Button>}
    </div>
  )

  if (block.type === "creneaux_du_jour") {
    const aujourdhui = jourDuCommerce(new Date(), c)
    const dater = () => onChange("date", aujourdhui)
    const tous = lireCreneaux(c.creneaux)
    const restants = creneauxRestants(c, new Date())
    const duJour = String(c.date || "") === aujourdhui
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {tous.length > 0 && (duJour
          ? bandeau(restants.length > 0, restants.length > 0 ? `En ligne : ${restants.length} créneau${restants.length > 1 ? "x" : ""} encore à venir aujourd'hui.` : "Tous les créneaux du jour sont passés : rien ne s'affiche en ligne.")
          : bandeau(false, `Invisible en ligne : c'est la liste du ${jourLisible(String(c.date || ""))}.`, { libelle: "Ce sont les créneaux d'aujourd'hui", agir: dater }))}
        {champ("title", "Titre", "Créneaux libres aujourd'hui")}
        {champ("creneaux", "Créneaux libres aujourd'hui", "10h30, 14h, 16h15", dater)}
        {choix("action", "Un créneau touché…", ACTIONS_CRENEAU)}
        {String(c.action || "Appeler") === "Lien de réservation"
          ? champ("url", "Lien de réservation", "https://…")
          : champ("phone", "Téléphone (appel ou WhatsApp)", "06 12 34 56 78")}
        {champ("note", "Note (optionnel)", "Appelez-nous, on vous le réserve.")}
      </div>
    )
  }

  if (block.type === "arrivage") {
    const aujourdhui = jourDuCommerce(new Date(), c)
    const dater = () => onChange("date", aujourdhui)
    const e = etatArrivage(c, new Date())
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {e.articles.length > 0 && (e.visible
          ? bandeau(true, `En ligne : « ${arriveLisible(e.depuisJours ?? 0)} ».`)
          : bandeau(false, c.date ? `Invisible en ligne : l'arrivage du ${jourLisible(String(c.date))} a dépassé sa durée.` : "Invisible en ligne : l'arrivage n'est pas daté.", { libelle: "C'est l'arrivage d'aujourd'hui", agir: dater }))}
        {champ("title", "Titre", "Arrivage du jour")}
        <Reglage nom="Arrivages (un par ligne, prix facultatif)" style={etiquette}>{id => (
          <textarea id={id} className="ui-textarea" rows={4} value={c.articles || ""} placeholder={"Pivoines de la Drôme — 4 € la tige\nRenoncules — 2,50 €"}
            onChange={ev => { onChange("articles", ev.target.value); dater() }} />
        )}</Reglage>
        {choix("duree", "Affiché pendant", DUREES_ARRIVAGE)}
        {champ("note", "Note (optionnel)", "Arrivé ce matin du marché.")}
      </div>
    )
  }

  // attente_live
  const horodater = () => onChange("maj", String(Date.now()))
  const a = attenteActuelle(c, Date.now())
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {c.attente && (a
        ? bandeau(true, `En ligne : « ${a.libelle} », mis à jour ${depuisLisible(a.depuisMin)}.`, { libelle: "Toujours d'actualité", agir: horodater })
        : bandeau(false, "Invisible en ligne : l'attente date de plus de 3 h.", { libelle: "Toujours d'actualité", agir: horodater }))}
      {champ("title", "Titre", "Sans rendez-vous")}
      {choix("attente", "Attente du moment", ATTENTES, horodater)}
      {champ("note", "Note (optionnel)", "Passez directement au salon.")}
    </div>
  )
}
