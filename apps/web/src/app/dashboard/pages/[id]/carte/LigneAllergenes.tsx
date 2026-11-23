"use client"

// Une ligne du mode « Allergènes » de Ma carte (vague 2, revue du 23 nov.).
// Fermée : le produit et ce qui est renseigné (« Non renseigné », « Aucun des 14 »,
// « Gluten, Lait »). Ouverte : les 14 allergènes réglementaires en boutons à
// presser (44 px, au pouce), plus « Aucun des 14 » — un choix EXPLICITE, pour
// ne jamais confondre « rien coché » et « pas encore regardé ».

import { useState } from "react"
import { Button } from "@/components/ui/Button"
import { propsAnnonce } from "@/lib/annonceAuLecteur"
import { ALLERGENES, phraseAllergenes } from "@/app/dashboard/builder/shared-renderer/models/allergenes"
import type { PlatDeLaCarte } from "@/app/dashboard/builder/shared-renderer/models/epuises"

const MUTED = "var(--muted)"

export function etatAllergenes(a: string[] | null): string {
  if (a === null) return "Non renseigné"
  return a.length ? phraseAllergenes(a) : "Aucun des 14 allergènes"
}

export function LigneAllergenes({ plat, onEnregistrer }: { plat: PlatDeLaCarte; onEnregistrer: (codes: string[]) => Promise<string | null> }) {
  const [ouvert, setOuvert] = useState(false)
  const [choix, setChoix] = useState<string[]>([])
  const [aucun, setAucun] = useState(false)
  const [envoi, setEnvoi] = useState(false)
  const [refus, setRefus] = useState("")
  const libelle = plat.desc ? `${plat.nom}, ${plat.desc}` : plat.nom

  if (!ouvert) return (
    <button type="button" onClick={() => { setChoix(plat.allergenes ?? []); setAucun(plat.allergenes?.length === 0); setRefus(""); setOuvert(true) }}
      aria-label={`Allergènes de ${libelle} : ${etatAllergenes(plat.allergenes)}. Modifier`}
      style={{ width: "100%", minHeight: 56, display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left", color: "var(--ink)", fontFamily: "inherit" }}>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 15, fontWeight: 600, overflowWrap: "anywhere" }}>{plat.nom}</span>
        <span style={{ display: "block", fontSize: 13, marginTop: 2, color: plat.allergenes === null ? "var(--warning)" : MUTED }}>{etatAllergenes(plat.allergenes)}</span>
      </span>
      <span aria-hidden="true" style={{ flexShrink: 0, fontSize: 13, fontWeight: 600, color: "var(--accent)" }}>{plat.allergenes === null ? "Renseigner" : "Modifier"}</span>
    </button>
  )

  const basculer = (code: string) => { setAucun(false); setChoix(c => c.includes(code) ? c.filter(x => x !== code) : [...c, code]) }
  const pret = aucun || choix.length > 0

  async function valider(e: React.FormEvent) {
    e.preventDefault()
    if (envoi || !pret) return
    setEnvoi(true); setRefus("")
    const phrase = await onEnregistrer(aucun ? [] : choix)
    setEnvoi(false)
    if (phrase) { setRefus(phrase); return }
    setOuvert(false)
  }
  const puce = (actif: boolean): React.CSSProperties => ({
    minHeight: 44, padding: "8px 12px", borderRadius: 999, cursor: "pointer", fontSize: 14, fontWeight: 600, fontFamily: "inherit",
    border: `1px solid ${actif ? "var(--accent)" : "var(--line-strong)"}`,
    background: actif ? "color-mix(in srgb, var(--accent) 16%, transparent)" : "transparent",
    color: actif ? "var(--ink)" : MUTED,
  })
  return (
    <form onSubmit={valider} aria-label={`Allergènes de ${libelle}`} style={{ display: "flex", flexDirection: "column", gap: 10, padding: "12px 16px 14px", background: "var(--surface-2)" }}>
      <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "var(--ink)", overflowWrap: "anywhere" }}>{plat.nom}</p>
      <div role="group" aria-label="Les 14 allergènes" style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {ALLERGENES.map(a => (
          <button key={a.code} type="button" aria-pressed={choix.includes(a.code)} onClick={() => basculer(a.code)} style={puce(choix.includes(a.code))}>{a.libelle}</button>
        ))}
      </div>
      <div>
        <button type="button" aria-pressed={aucun} onClick={() => { setAucun(v => !v); setChoix([]) }} style={puce(aucun)}>Aucun des 14</button>
      </div>
      {refus && <p {...propsAnnonce("erreur")} style={{ margin: 0, color: "var(--danger)", fontSize: 13 }}>{refus}</p>}
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
        <Button type="button" variant="ghost" size="sm" onClick={() => setOuvert(false)}>Annuler</Button>
        <Button type="submit" size="sm" loading={envoi} disabled={!pret}>Enregistrer</Button>
      </div>
    </form>
  )
}
