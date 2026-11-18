"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useDefilementRetrouve, useTitreSorti } from "@/lib/coquilleAppli"
import { useFermetureModale } from "@/lib/useFermetureModale"
import MobileNav from "@/components/MobileNav"

// Même géométrie que la coquille : une barre en haut, et UNE zone qui défile.
export default function BancCoquille({ ecran }: { ecran: string }) {
  const zone = useRef<HTMLElement>(null)
  const chemin = usePathname()
  useDefilementRetrouve(zone, chemin)
  const titreSorti = useTitreSorti(zone, chemin)
  const [couche, setCouche] = useState(false)
  useFermetureModale(couche, () => setCouche(false))
  const titre = ecran === "liste" ? "Mes pages (démo)" : "Une page (démo)"

  return (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column", background: "var(--qd-bg, #0b0b0b)", color: "var(--qd-ink, #eee)" }}>
      <header data-testid="barre" style={{ height: 56, flex: "none", display: "flex", alignItems: "center", padding: "0 16px", borderBottom: "1px solid #333" }}>
        <span data-testid="barre-titre">{titreSorti ? titre : "QRowg"}</span>
      </header>
      <main ref={zone} data-testid="zone" style={{ flex: 1, overflowY: "auto" }}>
        <div style={{ padding: 16 }}>
          <h1 style={{ margin: "8px 0 16px" }}>{titre}</h1>
          <button type="button" onClick={() => setCouche(true)} style={{ minHeight: 44 }}>Ouvrir une couche</button>
          {Array.from({ length: 60 }, (_, i) => (
            <p key={i} style={{ minHeight: 48, margin: 0, borderBottom: "1px solid #222", display: "flex", alignItems: "center" }}>
              {ecran === "liste" && i === 40
                ? <Link href="/e2e-harness/coquille/detail">Ouvrir la page 40</Link>
                : <>Ligne {i}</>}
            </p>
          ))}
        </div>
      </main>
      {/* La vraie barre du bas (lot 5) : sa feuille « Plus » sans session. */}
      {ecran === "nav" && <MobileNav />}
      {couche && (
        <div role="dialog" aria-label="Couche de démonstration" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <p>Couche ouverte</p>
        </div>
      )}
    </div>
  )
}
