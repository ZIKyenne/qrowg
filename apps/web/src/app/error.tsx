"use client"

import { useEffect } from "react"

// Frontiere d'erreur applicative (sous le layout racine) : toute erreur non geree dans
// une route affiche cette page de marque au lieu de l'ecran d'erreur brut de Next.
function isChunkError(error?: Error): boolean {
  const s = `${error?.name || ""} ${error?.message || ""}`
  return /ChunkLoadError|Loading chunk|Failed to load chunk|dynamically imported module|Importing a module script failed|error loading dynamically/i.test(s)
}

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const chunk = isChunkError(error)
  useEffect(() => {
    // Erreur de chunk (redeploiement) : on recharge UNE fois (garde-fou anti-boucle 12 s).
    if (chunk && typeof window !== "undefined") {
      try {
        const KEY = "qf_chunk_reload_at"
        const last = Number(sessionStorage.getItem(KEY) || 0)
        if (Date.now() - last > 12000) { sessionStorage.setItem(KEY, String(Date.now())); window.location.reload() }
      } catch { /* noop */ }
    }
  }, [chunk])
  const retry = () => { if (chunk && typeof window !== "undefined") window.location.reload(); else reset() }
  return (
    <div style={{ minHeight: "100vh", background: "#080808", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "DM Sans, sans-serif", padding: 24, textAlign: "center" }}>
      <div style={{ fontSize: 52, marginBottom: 12 }}>⚠️</div>
      <p style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 30, color: "#C9A84C", fontWeight: 700, margin: "0 0 8px", lineHeight: 1 }}>{chunk ? "Mise à jour de l'application" : "Une erreur est survenue"}</p>
      <p style={{ color: "#8A8478", fontSize: 14, margin: "0 0 28px", maxWidth: 360, lineHeight: 1.6 }}>
        {chunk
          ? "Une nouvelle version vient d'être publiée. Rechargement en cours… Si rien ne se passe, touchez Recharger."
          : "Quelque chose s'est mal passé de notre côté. Vous pouvez réessayer ou revenir à l'accueil."}
      </p>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
        <button onClick={retry} style={{ background: "linear-gradient(90deg,#C9A84C,#b8953f)", color: "#080808", border: "none", padding: "12px 24px", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
          {chunk ? "Recharger" : "Réessayer"}
        </button>
        <a href="/" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", color: "#F5F0E8", textDecoration: "none", padding: "12px 24px", borderRadius: 10, fontSize: 14, fontWeight: 600 }}>
          Retour à l&apos;accueil
        </a>
      </div>
    </div>
  )
}
