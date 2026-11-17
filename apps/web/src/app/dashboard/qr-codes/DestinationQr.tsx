"use client"

// Fenêtre « Où mène ce QR ? » du Studio compact. Reprend le geste de l'ancien
// Studio (changer la destination sans réimprimer, historique, rétablir), avec les
// appels de ./gestesQr. Une destination ne change qu'après confirmation : les QR
// déjà imprimés suivent immédiatement.

import { useEffect, useState } from "react"
import { AlertTriangle, ExternalLink, RotateCcw } from "lucide-react"
import { Modal } from "@/components/ui/Modal"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { propsAnnonce } from "@/lib/annonceAuLecteur"
import {
  TYPES_DE_DESTINATION, libelleDeDestination, changerDestination, revenirALaPage, retablirDestination,
  type DestEntry, type EtatDestination,
} from "./gestesQr"

const LINE = "rgba(255,255,255,0.08)"
const MUTED = "var(--muted)"

type Props = {
  open: boolean
  onClose: () => void
  qrId: string
  nomDeLaPage: string
  urlDeLaPage: string
  etat: EtatDestination
  /** Le serveur a changé la destination : le parent met sa liste à jour. */
  onEtat: (e: EtatDestination) => void
  onSucces: (phrase: string) => void
}

export default function DestinationQr({ open, onClose, qrId, nomDeLaPage, urlDeLaPage, etat, onEtat, onSucces }: Props) {
  const [mode, setMode] = useState<"voir" | "changer" | "confirmer">("voir")
  const [type, setType] = useState<string>("url")
  const [valeur, setValeur] = useState("")
  const [note, setNote] = useState("")
  const [occupe, setOccupe] = useState(false)
  const [erreur, setErreur] = useState("")

  // Chaque ouverture repart de la vue « où mène-t-il », sans brouillon d'un autre QR.
  useEffect(() => { if (open) { setMode("voir"); setValeur(""); setNote(""); setErreur(""); setType("url") } }, [open, qrId])

  const actuelle = etat.dest_override
  const urlActuelle = actuelle ? (actuelle.url || actuelle.value) : urlDeLaPage
  const exemple = TYPES_DE_DESTINATION.find(t => t.id === type)?.exemple ?? ""

  async function appliquer() {
    setOccupe(true); setErreur("")
    const r = await changerDestination(qrId, type, valeur, note)
    setOccupe(false)
    if (!r.ok) { setErreur(r.refus); setMode("changer"); return }
    onEtat({ dest_override: r.dest_override, dest_history: r.dest_history })
    setMode("voir"); setValeur(""); setNote("")
    onSucces("Destination changée : les QR imprimés y mènent déjà.")
  }
  async function revenir() {
    setOccupe(true); setErreur("")
    const r = await revenirALaPage(qrId)
    setOccupe(false)
    if (!r.ok) { setErreur(r.refus); return }
    // L'ancienne destination rejoint l'historique côté serveur.
    onEtat({ dest_override: null, dest_history: actuelle ? [actuelle, ...etat.dest_history] : etat.dest_history })
    onSucces("Le QR mène de nouveau à votre page.")
  }
  async function retablir(i: number) {
    setOccupe(true); setErreur("")
    const r = await retablirDestination(qrId, i)
    setOccupe(false)
    if (!r.ok) { setErreur(r.refus); return }
    onEtat({ dest_override: r.dest_override, dest_history: r.dest_history })
    onSucces("Destination rétablie.")
  }

  return (
    <Modal open={open} onClose={occupe ? () => {} : onClose} title="Où mène ce QR ?" maxWidth={480}
      footer={mode === "confirmer"
        ? <>
            <Button variant="ghost" onClick={() => setMode("changer")} disabled={occupe}>Retour</Button>
            <Button variant="primary" loading={occupe} onClick={appliquer}>Confirmer le changement</Button>
          </>
        : mode === "changer"
        ? <>
            <Button variant="ghost" onClick={() => { setMode("voir"); setErreur("") }}>Annuler</Button>
            <Button variant="primary" disabled={!valeur.trim()} onClick={() => setMode("confirmer")}>Continuer</Button>
          </>
        : <Button variant="ghost" onClick={onClose}>Fermer</Button>}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

        {/* Où il mène maintenant */}
        <div style={{ padding: "12px 14px", border: `1px solid ${LINE}`, borderRadius: 12, background: "rgba(255,255,255,0.03)" }}>
          <p style={{ margin: "0 0 4px", fontSize: 12, color: MUTED }}>{actuelle ? "Redirigé vers" : "Mène à votre page"}</p>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "var(--ink)" }}>{actuelle ? libelleDeDestination(actuelle) : nomDeLaPage}</p>
          <a href={urlActuelle} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 4, fontSize: 13, color: "var(--accent)", maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{urlActuelle}</span><ExternalLink size={12} style={{ flexShrink: 0 }} />
          </a>
          {mode === "voir" && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
              <Button size="sm" variant="secondary" onClick={() => { setMode("changer"); setErreur("") }}>Changer la destination</Button>
              {actuelle && <Button size="sm" variant="ghost" loading={occupe} onClick={revenir}>Revenir à la page</Button>}
            </div>
          )}
        </div>

        {mode === "voir" && !actuelle && (
          <p style={{ margin: 0, fontSize: 13, color: MUTED, lineHeight: 1.5 }}>Ce QR est dynamique : vous pouvez le faire mener ailleurs sans le réimprimer.</p>
        )}

        {/* Changer */}
        {mode === "changer" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div role="radiogroup" aria-label="Type de destination" style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {TYPES_DE_DESTINATION.map(t => (
                <button key={t.id} type="button" role="radio" aria-checked={type === t.id} onClick={() => { setType(t.id); setErreur("") }}
                  className={"da-pill" + (type === t.id ? " on" : "")} style={{ minHeight: 44 }}>{t.libelle}</button>
              ))}
            </div>
            <Input label="Nouvelle destination" value={valeur} onChange={e => { setValeur(e.target.value); setErreur("") }} placeholder={exemple} autoFocus />
            <Input label="Note pour vous (facultatif)" value={note} onChange={e => setNote(e.target.value)} placeholder="Ex. : promo de l'été" />
          </div>
        )}

        {mode === "confirmer" && (
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "12px 14px", borderRadius: 12, background: "color-mix(in srgb, var(--warning, #f5b74a) 9%, transparent)", border: "1px solid color-mix(in srgb, var(--warning, #f5b74a) 30%, transparent)" }}>
            <AlertTriangle size={16} color="var(--warning, #f5b74a)" style={{ flexShrink: 0, marginTop: 2 }} />
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: "var(--ink)" }}>
              Dès maintenant, tous les QR déjà imprimés mèneront vers <strong style={{ wordBreak: "break-all" }}>{valeur.trim()}</strong>. Vous pourrez revenir en arrière.
            </p>
          </div>
        )}

        {erreur && (
          <p {...propsAnnonce("erreur")} style={{ margin: 0, display: "flex", gap: 7, alignItems: "center", fontSize: 13, color: "var(--danger)" }}><AlertTriangle size={14} /> {erreur}</p>
        )}

        {/* Historique */}
        {mode === "voir" && etat.dest_history.length > 0 && (
          <div>
            <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 700, color: MUTED }}>Destinations précédentes</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {etat.dest_history.slice(0, 5).map((h: DestEntry, i: number) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 6px 6px 12px", border: `1px solid ${LINE}`, borderRadius: 10 }}>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 13, color: "var(--ink)" }}>{h.type === "page" ? nomDeLaPage : libelleDeDestination(h)}</span>
                    <span style={{ display: "block", fontSize: 12, color: MUTED, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.type === "page" ? urlDeLaPage : (h.url || h.value)}</span>
                  </span>
                  <Button size="sm" variant="ghost" disabled={occupe} onClick={() => retablir(i)} aria-label={`Rétablir ${h.type === "page" ? nomDeLaPage : libelleDeDestination(h)}`}><RotateCcw size={13} /> Rétablir</Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
