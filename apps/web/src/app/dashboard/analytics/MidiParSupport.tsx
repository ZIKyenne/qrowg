"use client"

// « Ce midi, par support » (vague 3, revue du 23 nov.) : la question du
// restaurateur après le service, sur une seule carte. Le bilan est calculé côté
// serveur (lib/clientsDuService) : seuls des nombres arrivent ici, jamais les
// empreintes anonymes des visiteurs.

import { Utensils } from "lucide-react"
import { phraseDuMidi, type BilanDuService } from "@/lib/clientsDuService"
import { nomDuQrSitue } from "@/lib/nomDuQr"

type Q = { id: string; short_code: string; label?: string | null; page_id?: string | null }

const MUTED = "var(--muted)"

export default function MidiParSupport({ bilan, qrs, pages }: { bilan: BilanDuService | null; qrs: Q[]; pages: { id: string; title?: string | null; slug?: string | null }[] }) {
  if (!bilan) return null
  const titreDe = (pageId?: string | null) => { const p = pages.find(x => x.id === pageId); return p?.title || p?.slug || null }
  const nom = (qrId: string) => {
    const q = qrs.find(x => x.id === qrId)
    return q ? nomDuQrSitue({ label: q.label, pageTitre: titreDe(q.page_id), short_code: q.short_code }) : "QR supprimé"
  }
  const valeur = (l: BilanDuService["lignes"][number]) => l.clients ?? l.scans
  const max = Math.max(1, ...bilan.lignes.map(valeur))
  const unite = bilan.mesure === "clients" ? "clients" : "scans"
  return (
    <section className="qd-carte" aria-labelledby="midi-titre" data-midi={bilan.mesure} style={{ padding: "16px 18px", marginBottom: 16 }}>
      <h2 id="midi-titre" style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "var(--ink)", display: "flex", alignItems: "center", gap: 8 }}>
        <Utensils size={16} aria-hidden="true" /> Le service de midi, par support
      </h2>
      <p style={{ margin: "4px 0 0", fontSize: 14, fontWeight: 600, color: bilan.total ? "var(--ink)" : MUTED }}>{phraseDuMidi(bilan)}</p>
      {bilan.mesure === "scans" && bilan.total > 0 && (
        <p style={{ margin: "4px 0 0", fontSize: 12, color: MUTED, lineHeight: 1.5 }}>
          Ce sont des scans : un client qui scanne deux fois compte deux fois. Le comptage des visiteurs distincts n&apos;est pas activé.
        </p>
      )}
      {bilan.lignes.length > 0 && (
        <ul style={{ listStyle: "none", margin: "12px 0 0", padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
          {bilan.lignes.map(l => (
            <li key={l.qrId}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 13.5 }}>
                <span style={{ color: "var(--ink)", minWidth: 0, overflowWrap: "anywhere" }}>{nom(l.qrId)}</span>
                <span style={{ color: "var(--ink)", fontWeight: 700, fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>{valeur(l)} <span style={{ color: MUTED, fontWeight: 400 }}>{unite}</span></span>
              </div>
              <div aria-hidden="true" style={{ height: 6, marginTop: 5, borderRadius: 3, background: "var(--surface-2)" }}>
                <div style={{ width: `${Math.round((valeur(l) / max) * 100)}%`, height: "100%", borderRadius: 3, background: "var(--accent)" }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
