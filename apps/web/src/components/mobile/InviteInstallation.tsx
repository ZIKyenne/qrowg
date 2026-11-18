"use client"

// InviteInstallation — « Installez QRowg sur ce téléphone » (lot 3 « appli »).
// La décision vit dans lib/installation (pure, testée) ; ce composant ne fait
// que montrer le bon geste : un bouton quand le système sait installer, les
// étapes sinon. Rien sur ordinateur, rien une fois installé.

import { useEffect, useState } from "react"
import { Smartphone, Share } from "lucide-react"
import { useInstallation, etapesInstallation, reporterLInvitation, reporteeLe, inviterSurLAccueil } from "@/lib/installation"

export function InviteInstallation({ onPlusTard }: {
  /** Présent sur l'Accueil : « Plus tard » range la carte pour un temps. */
  onPlusTard?: () => void
}) {
  const { mode, installer } = useInstallation()
  const [refus, setRefus] = useState(false)
  if (mode === "installee" || mode === "aucun") return null

  const etapes = etapesInstallation(mode)
  return (
    <section aria-label="Installer QRowg sur ce téléphone" className="qd-carte"
      style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12, border: "1px solid color-mix(in srgb, var(--accent) 30%, transparent)" }}>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <span aria-hidden="true" style={{ flexShrink: 0, width: 40, height: 40, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", background: "color-mix(in srgb, var(--accent) 14%, transparent)", color: "var(--accent)" }}>
          <Smartphone size={20} strokeWidth={1.7} />
        </span>
        <div style={{ minWidth: 0 }}>
          <p style={{ margin: 0, color: "var(--ink)", fontSize: 15, fontWeight: 600 }}>Installez QRowg sur ce téléphone</p>
          <p style={{ margin: "3px 0 0", color: "var(--muted)", fontSize: 14, lineHeight: 1.45 }}>Vos pages et vos QR à un toucher, en plein écran, comme une appli.</p>
        </div>
      </div>

      {mode === "native" ? (
        <button type="button" className="da-btn-primary da-btn-primary--sm" style={{ justifyContent: "center", minHeight: 48 }}
          onClick={async () => { if (!(await installer())) setRefus(true) }}>
          Installer QRowg
        </button>
      ) : (
        <ol style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 6, color: "var(--ink)", fontSize: 14, lineHeight: 1.45 }}>
          {etapes.map((e, i) => (
            <li key={i}>
              {mode === "ios" && i === 0 && <Share size={14} aria-hidden="true" style={{ verticalAlign: "-2px", marginRight: 6, color: "var(--accent)" }} />}
              {e}
            </li>
          ))}
        </ol>
      )}
      {refus && <p role="status" style={{ margin: 0, color: "var(--muted)", fontSize: 13 }}>Pas de souci : vous pourrez l&apos;installer plus tard depuis le menu du navigateur.</p>}

      {onPlusTard && (
        <button type="button" className="da-btn-ghost da-btn-ghost--sm" style={{ alignSelf: "flex-start", minHeight: 44 }}
          onClick={() => { reporterLInvitation(); onPlusTard() }}>
          Plus tard
        </button>
      )}
    </section>
  )
}

/**
 * L'Accueil : la même carte, seulement pour qui a une page en ligne — il y a
 * alors quelque chose à garder sous la main — et pas si « Plus tard » date de
 * moins d'un mois (lib/installation · inviterSurLAccueil).
 */
export function InvitationAccueil({ pagesEnLigne }: { pagesEnLigne: number }) {
  const { mode } = useInstallation()
  const [rangee, setRangee] = useState(false)
  // Lu après montage : la mémoire du navigateur n'existe pas au serveur.
  const [report, setReport] = useState<number | null | undefined>(undefined)
  useEffect(() => { setReport(reporteeLe()) }, [])
  if (rangee || report === undefined) return null
  if (!inviterSurLAccueil({ mode, pagesEnLigne, reporteeLe: report, maintenant: Date.now() })) return null
  return <InviteInstallation onPlusTard={() => setRangee(true)} />
}
