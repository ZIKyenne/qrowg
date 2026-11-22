"use client"

// QR-010 (audit UX v2, 22 nov.) : où menait ce QR de lien avant.
// « Revenir » ne change rien tout seul : il rouvre la boîte « Modifier la
// destination », pré-remplie. Un changement sur un QR imprimé se confirme toujours.

import { Button } from "@/components/ui/Button"
import { dateLisible } from "@/lib/jourDuCommerce"
import type { InstantQr } from "./instantQr"

const MUTED = "var(--muted)"

export default function DestinationsPrecedentes({ historique, revenir }: { historique: InstantQr["dest_history"]; revenir: (url: string) => void }) {
  if (!historique?.length) return null
  return (
    <div aria-label="Destinations précédentes" style={{ marginTop: 10 }}>
      <p style={{ color: MUTED, fontSize: 11, textTransform: "uppercase", letterSpacing: 1, margin: "0 0 4px" }}>Destinations précédentes</p>
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 4 }}>
        {historique.slice(0, 3).map((h, i) => (
          <li key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Deux lignes : l'adresse peut se couper, la date jamais (à 390 px,
                une seule ligne tronquait « jusqu'au 1… »). */}
            <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
              <span style={{ color: "var(--ink)", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={h.url}>{h.url.replace(/^https?:\/\//, "")}</span>
              <span style={{ color: MUTED, fontSize: 11.5 }}>jusqu&apos;au {dateLisible(h.remplaceeLe, { day: "numeric", month: "long", year: "numeric" })}</span>
            </span>
            <Button onClick={() => revenir(h.url)} variant="ghost" size="sm" aria-label={`Revenir à ${h.url}`}>Revenir</Button>
          </li>
        ))}
      </ul>
    </div>
  )
}
