"use client"
// État « hors connexion » (revue du 9 septembre, P2) : la coquille le dit une fois,
// en haut, au lieu de laisser chaque écran échouer en silence. Disparaît dès que
// le réseau revient. Ne promet rien que l'application ne fait pas.
import { useEffect, useState } from "react"
import { WifiOff } from "lucide-react"

export function BandeauHorsConnexion() {
  const [horsLigne, setHorsLigne] = useState(false)
  useEffect(() => {
    const maj = () => setHorsLigne(typeof navigator !== "undefined" && navigator.onLine === false)
    maj()
    window.addEventListener("online", maj); window.addEventListener("offline", maj)
    return () => { window.removeEventListener("online", maj); window.removeEventListener("offline", maj) }
  }, [])
  if (!horsLigne) return null
  return (
    <div role="status" aria-live="polite" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "8px 14px", background: "var(--surface-2)", borderBottom: "1px solid var(--line-strong)", color: "var(--ink)", fontSize: 12.5, fontWeight: 500 }}>
      <WifiOff size={14} aria-hidden="true" style={{ color: "var(--warning)" }} />
      Hors connexion — les modifications ne peuvent pas être enregistrées pour l&apos;instant.
    </div>
  )
}
