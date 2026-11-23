"use client"

// L'ardoise du jour, en tête de « Ma carte » (vague 1, revue du 23 nov.).
//
// Objectif : moins de 30 secondes, au téléphone, sans ouvrir l'éditeur.
//  · Ce que voient les clients EN CE MOMENT, en une phrase.
//  · L'ardoise d'hier se remet d'un toucher (« Remettre celle du … »).
//  · Sinon : jusqu'à 4 plats (nom, prix au pavé numérique, description
//    facultative), et « Mettre en ligne ». Datée du jour du commerce.
// Les règles vivent dans shared-renderer/models/ardoiseDuJour (pur, testé).

import { useRef, useState } from "react"
import { Plus, X } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { useToast } from "@/components/Toast"
import { propsAnnonce } from "@/lib/annonceAuLecteur"
import { limite } from "@/lib/limitesDeSaisie"
import { formaterCommeAvant } from "@/app/dashboard/builder/shared-renderer/models/prixDeLaCarte"
import { phraseArdoise, PLATS_MAX, type ArdoiseVue, type PlatSaisi } from "@/app/dashboard/builder/shared-renderer/models/ardoiseDuJour"

export type EcrireArdoise = (plats: PlatSaisi[]) => Promise<{ ok: true; ardoise: ArdoiseVue } | { ok: false; phrase: string }>

const MUTED = "var(--muted)"
const VIDE: PlatSaisi = { nom: "", prix: "", desc: "" }

export function ArdoiseDuJour({ ardoise: depart, ecrire, enLigne, prixVoisin }: {
  ardoise: ArdoiseVue | null
  ecrire: EcrireArdoise
  enLigne: boolean
  /** Un prix de la carte, pour donner aux prix tapés la même forme (« 14 » → « 14 € »). */
  prixVoisin: string
}) {
  const toast = useToast()
  const [ardoise, setArdoise] = useState(depart)
  const [ouvert, setOuvert] = useState(false)
  const [lignes, setLignes] = useState<PlatSaisi[]>([VIDE])
  const [envoi, setEnvoi] = useState(false)
  const [refus, setRefus] = useState("")
  const refPremier = useRef<HTMLInputElement>(null)

  const etat = ardoise?.etat ?? "vide"
  const visible = etat === "a_jour" || etat === "permanente"
  const phrase = phraseArdoise(ardoise)

  function ouvrir() {
    setLignes(ardoise?.plats.length ? ardoise.plats.map(p => ({ ...p })) : [{ ...VIDE }])
    setRefus(""); setOuvert(true)
    setTimeout(() => refPremier.current?.focus(), 0)
  }

  async function envoyer(plats: PlatSaisi[]) {
    if (envoi) return
    setEnvoi(true); setRefus("")
    const voisin = prixVoisin || plats.find(p => p.prix)?.prix || ""
    const issue = await ecrire(plats.map(p => ({ ...p, prix: formaterCommeAvant(voisin, p.prix) })))
      .catch(() => ({ ok: false as const, phrase: "L'ardoise n'a pas pu être enregistrée. Réessayez." }))
    setEnvoi(false)
    if (!issue.ok) { setRefus(issue.phrase); if (!ouvert) toast.error(issue.phrase); return }
    setArdoise(issue.ardoise); setOuvert(false)
    toast.success(enLigne ? "L'ardoise est en ligne pour aujourd'hui" : "Ardoise enregistrée : elle sera visible dès la publication de la page")
  }

  const changer = (k: number, champ: keyof PlatSaisi, v: string) => setLignes(ls => ls.map((l, i) => i === k ? { ...l, [champ]: v } : l))

  return (
    <section className="qd-carte" aria-labelledby="ardoise-titre" data-ardoise-etat={etat} style={{ margin: "0 0 16px", overflow: "hidden" }}>
      <div style={{ padding: "14px 16px 12px", display: "flex", flexDirection: "column", gap: 10 }}>
        <div>
          <h2 id="ardoise-titre" style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "var(--ink)" }}>L&apos;ardoise du jour</h2>
          <p role="status" style={{ margin: "3px 0 0", fontSize: 13, lineHeight: 1.45, fontWeight: 600,
            color: visible ? "var(--success)" : etat === "perimee" ? "var(--warning)" : MUTED }}>{phrase}</p>
        </div>

        {!ouvert && visible && ardoise && (
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 4 }}>
            {ardoise.plats.map((p, i) => (
              <li key={i} style={{ display: "flex", gap: 8, fontSize: 14, color: "var(--ink)" }}>
                <span style={{ flex: 1, minWidth: 0, overflowWrap: "anywhere" }}>{p.nom}</span>
                {p.prix && <span style={{ fontWeight: 700, flexShrink: 0 }}>{p.prix}</span>}
              </li>
            ))}
          </ul>
        )}

        {!ouvert && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {etat === "perimee" && ardoise && (
              <Button size="sm" loading={envoi} onClick={() => envoyer(ardoise.plats)}>Remettre celle du {ardoise.ecriteLe}</Button>
            )}
            <Button size="sm" variant={etat === "perimee" || visible ? "secondary" : "primary"} onClick={ouvrir}>
              {visible ? "Modifier l'ardoise" : etat === "perimee" ? "En écrire une autre" : "Écrire l'ardoise du jour"}
            </Button>
          </div>
        )}
      </div>

      {ouvert && (
        <form aria-label="Écrire l'ardoise du jour" onSubmit={e => { e.preventDefault(); envoyer(lignes) }}
          style={{ display: "flex", flexDirection: "column", gap: 12, padding: "12px 16px 14px", borderTop: "1px solid var(--line)", background: "var(--surface-2)" }}>
          {lignes.map((l, k) => (
            <fieldset key={k} style={{ border: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
              <legend className="sr-only">Plat {k + 1}</legend>
              {/* Le nom a toute la largeur : au téléphone, « Blanquette de veau » ne se coupe pas. */}
              <div style={{ display: "grid", gridTemplateColumns: lignes.length > 1 ? "1fr auto" : "1fr", gap: 8, alignItems: "end" }}>
                <Input ref={k === 0 ? refPremier : undefined} label={`Plat ${k + 1}`} value={l.nom} onChange={e => changer(k, "nom", e.target.value)}
                  placeholder={k === 0 ? "Blanquette de veau" : undefined} autoComplete="off" enterKeyHint="next" maxLength={limite("nomDeProduit")} />
                {lignes.length > 1 && <Button type="button" variant="ghost" size="sm" aria-label={`Retirer le plat ${k + 1}`} onClick={() => setLignes(ls => ls.filter((_, i) => i !== k))} leftIcon={<X size={16} aria-hidden="true" />} />}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "104px 1fr", gap: 8 }}>
                <Input label="Prix" value={l.prix} onChange={e => changer(k, "prix", e.target.value)}
                  placeholder={k === 0 ? "14 €" : undefined} inputMode="decimal" autoComplete="off" enterKeyHint="next" maxLength={limite("prixDeProduit")} />
                <Input label="Description (facultatif)" value={l.desc} onChange={e => changer(k, "desc", e.target.value)}
                  placeholder={k === 0 ? "Riz, carottes" : undefined} autoComplete="off" enterKeyHint="done" maxLength={limite("descriptionDeProduit")} />
              </div>
            </fieldset>
          ))}
          {lignes.length < PLATS_MAX && (
            <div>
              <Button type="button" variant="ghost" size="sm" leftIcon={<Plus size={15} aria-hidden="true" />}
                onClick={() => setLignes(ls => [...ls, { ...VIDE }])}>Un autre plat</Button>
            </div>
          )}
          {refus && <p {...propsAnnonce("erreur")} style={{ margin: 0, color: "var(--danger)", fontSize: 13 }}>{refus}</p>}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
            <Button type="button" variant="ghost" size="sm" onClick={() => { setOuvert(false); setRefus("") }}>Annuler</Button>
            <Button type="submit" size="sm" loading={envoi} disabled={!lignes.some(l => l.nom.trim())}>
              {enLigne ? "Mettre en ligne" : "Enregistrer"}
            </Button>
          </div>
        </form>
      )}
    </section>
  )
}
