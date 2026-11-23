"use client"

// ChoixAuRetour — D3 (audit UX v2, 23 nov.) : AVANT l'échéance, l'abonné
// choisit ce qui reste actif s'il repasse au plan gratuit. Les CGU le
// promettaient ; le webhook éteignait les plus récents sans demander.
// Le choix est lu par le webhook Stripe à la bascule (lib/gardeAuRetour).

import { useState } from "react"
import { Button } from "@/components/ui/Button"
import { effetDe, serveurAFait, refusDuServeur } from "@/lib/effetConfirme"
import { propsAnnonce } from "@/lib/annonceAuLecteur"

type Candidat = { id: string; nom: string | null; detail: string | null; garde: boolean }
type Reponse = { disponible: boolean; places: { liens: number; pages: number }; liens: Candidat[]; pages: Candidat[] }

const CASE = { width: 18, height: 18, flex: "none", accentColor: "var(--qd-gold, #C9A84C)" } as const
const sansProtocole = (u: string | null) => (u || "").replace(/^https?:\/\//, "").replace(/\/$/, "")
const nomDuLien = (c: Candidat) => c.nom || sansProtocole(c.detail) || "QR sans nom"
const nomDeLaPage = (c: Candidat) => c.nom || "Page sans titre"

/** Ce qui est coché à l'ouverture : le choix déjà fait, sinon ce que la bascule garderait (les plus anciens). */
function depart(c: Candidat[], places: number): string[] {
  const gardes = c.filter(x => x.garde).map(x => x.id)
  return (gardes.length ? gardes : c.map(x => x.id)).slice(0, places)
}

function Groupe({ titre, nom, candidats, places, choisis, changer, libelle }: {
  titre: string; nom: string; candidats: Candidat[]; places: number
  choisis: string[]; changer: (ids: string[]) => void; libelle: (c: Candidat) => string
}) {
  const unSeul = places === 1
  return (
    <fieldset style={{ border: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 6 }}>
      <legend style={{ color: "var(--ink)", fontSize: 13, fontWeight: 700, padding: 0, marginBottom: 6 }}>{titre}</legend>
      {candidats.map(c => {
        const coche = choisis.includes(c.id)
        const plein = !unSeul && !coche && choisis.length >= places
        return (
          <label key={c.id} style={{ display: "flex", alignItems: "center", gap: 10, minHeight: 44, padding: "6px 10px", borderRadius: 12, border: `1px solid ${coche ? "var(--qd-gold, #C9A84C)" : "var(--border, rgba(255,255,255,.12))"}`, cursor: plein ? "not-allowed" : "pointer", opacity: plein ? 0.5 : 1 }}>
            {unSeul
              ? <input type="radio" name={nom} checked={coche} onChange={() => changer([c.id])} style={CASE} />
              : <input type="checkbox" name={nom} checked={coche} disabled={plein} onChange={() => changer(coche ? choisis.filter(i => i !== c.id) : [...choisis, c.id])} style={CASE} />}
            <span style={{ minWidth: 0, display: "flex", flexDirection: "column" }}>
              <span style={{ color: "var(--ink)", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{libelle(c)}</span>
              {c.detail && c.nom && <span style={{ color: "var(--muted)", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sansProtocole(c.detail)}</span>}
            </span>
          </label>
        )
      })}
    </fieldset>
  )
}

/** `pagesEnPauseAuRetour` : les jours de page offerts sont écoulés, les pages passeront en pause quoi qu'on choisisse (U1). */
export default function ChoixAuRetour({ pagesEnPauseAuRetour = false }: { pagesEnPauseAuRetour?: boolean }) {
  const [ouvert, setOuvert] = useState(false)
  const [donnees, setDonnees] = useState<Reponse | null>(null)
  const [liens, setLiens] = useState<string[]>([])
  const [pages, setPages] = useState<string[]>([])
  const [etat, setEtat] = useState<"repos" | "chargement" | "envoi" | "fait">("repos")
  const [refus, setRefus] = useState("")

  async function ouvrir() {
    setOuvert(true); setRefus(""); setEtat("chargement")
    const r = await effetDe("/api/abonnement/garde", { method: "GET" })
    const d = r.corps as Reponse | undefined
    if (!serveurAFait(r) || !d) { setRefus(refusDuServeur(r, "La liste n'a pas pu se charger. Réessayez dans un instant.") ?? "La liste n'a pas pu se charger."); setEtat("repos"); return }
    setDonnees(d)
    setLiens(depart(d.liens, d.places.liens))
    setPages(depart(d.pages, d.places.pages))
    setEtat("repos")
  }

  async function enregistrer() {
    if (etat === "envoi") return
    setEtat("envoi"); setRefus("")
    const r = await effetDe("/api/abonnement/garde", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ liens, pages }),
    })
    if (serveurAFait(r)) { setEtat("fait"); return }
    setRefus(refusDuServeur(r, "Le choix n'a pas pu être enregistré. Réessayez dans un instant.") ?? "Le choix n'a pas pu être enregistré.")
    setEtat("repos")
  }

  if (!ouvert) {
    return <div><Button size="sm" variant="secondary" onClick={ouvrir}>Choisir ce qui reste actif</Button></div>
  }

  // Un groupe n'apparaît que s'il y a vraiment un choix à faire.
  const groupeLiens = donnees && donnees.liens.length > donnees.places.liens
  const groupePages = !pagesEnPauseAuRetour && donnees && donnees.pages.length > donnees.places.pages
  const noms = donnees ? [
    ...(pagesEnPauseAuRetour ? [] : donnees.pages.filter(c => pages.includes(c.id)).map(nomDeLaPage)),
    ...donnees.liens.filter(c => liens.includes(c.id)).map(nomDuLien),
  ] : []

  return (
    <div aria-label="Ce qui reste actif au retour au plan gratuit" style={{ display: "flex", flexDirection: "column", gap: 14, padding: 14, borderRadius: 12, border: "1px solid var(--border, rgba(255,255,255,.12))", maxWidth: 520 }}>
      {etat === "chargement" && <div className="skeleton" aria-hidden="true" style={{ height: 88, borderRadius: 12 }} />}

      {donnees && !donnees.disponible && (
        <p style={{ color: "var(--muted)", fontSize: 13, margin: 0 }}>Ce réglage n&apos;est pas encore disponible. Réessayez un peu plus tard.</p>
      )}

      {donnees?.disponible && etat !== "chargement" && (
        <>
          <p style={{ color: "var(--muted)", fontSize: 13, margin: 0, lineHeight: 1.5 }}>
            {pagesEnPauseAuRetour
              ? <>Le plan gratuit couvre {donnees.places.liens === 1 ? "un QR modifiable" : `${donnees.places.liens} QR modifiables`}. Vos pages, elles, passeraient en pause : leurs jours offerts sont écoulés. Choisissez le QR qui reste actif si vous y revenez ; les autres seront mis en pause, sans rien supprimer.</>
              : <>Le plan gratuit couvre {donnees.places.pages === 1 ? "une page" : `${donnees.places.pages} pages`} et {donnees.places.liens === 1 ? "un QR modifiable" : `${donnees.places.liens} QR modifiables`}. Choisissez ceux qui restent actifs si vous y revenez ; les autres seront mis en pause, sans rien supprimer.</>}
          </p>
          {groupePages && <Groupe titre="Page qui reste en ligne" nom="garde-page" candidats={donnees.pages} places={donnees.places.pages} choisis={pages} changer={ids => { setPages(ids); setEtat("repos") }} libelle={nomDeLaPage} />}
          {groupeLiens && <Groupe titre="QR modifiable qui reste actif" nom="garde-lien" candidats={donnees.liens} places={donnees.places.liens} choisis={liens} changer={ids => { setLiens(ids); setEtat("repos") }} libelle={nomDuLien} />}
          {!groupePages && !groupeLiens && (
            <p style={{ color: "var(--ink)", fontSize: 13, margin: 0 }}>Tout ce qui est actif aujourd&apos;hui tient dans le plan gratuit : rien ne serait mis en pause.</p>
          )}
          {(groupePages || groupeLiens) && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <Button size="sm" variant="primary" onClick={enregistrer} loading={etat === "envoi"} disabled={etat === "envoi"}>Enregistrer mon choix</Button>
              <Button size="sm" variant="ghost" onClick={() => setOuvert(false)}>Fermer</Button>
            </div>
          )}
          {etat === "fait" && (
            <p {...propsAnnonce("succes")} style={{ color: "var(--success, #34D399)", fontSize: 13, margin: 0, lineHeight: 1.5 }}>
              Choix enregistré. Si vous repassez au gratuit, {noms.length ? noms.map(n => `« ${n} »`).join(" et ") : "votre sélection"} {noms.length > 1 ? "restent actifs" : "reste actif"}.
            </p>
          )}
        </>
      )}

      {refus && <p {...propsAnnonce("erreur")} style={{ color: "var(--danger)", fontSize: 13, margin: 0 }}>{refus}</p>}
    </div>
  )
}
