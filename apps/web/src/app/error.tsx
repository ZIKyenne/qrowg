"use client"

// Frontiere d'erreur applicative (sous le layout racine) : toute erreur non geree dans
// une route affiche cette page de marque au lieu de l'ecran d'erreur brut de Next.
export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div style={{ minHeight: "100vh", background: "#080808", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "DM Sans, sans-serif", padding: 24, textAlign: "center" }}>
      <div style={{ fontSize: 52, marginBottom: 12 }}>⚠️</div>
      <p style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 30, color: "#C9A84C", fontWeight: 700, margin: "0 0 8px", lineHeight: 1 }}>Une erreur est survenue</p>
      <p style={{ color: "#8A8478", fontSize: 14, margin: "0 0 28px", maxWidth: 360, lineHeight: 1.6 }}>
        Quelque chose s&apos;est mal passé de notre côté. Vous pouvez réessayer ou revenir à l&apos;accueil.
      </p>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
        <button onClick={reset} style={{ background: "linear-gradient(90deg,#C9A84C,#b8953f)", color: "#080808", border: "none", padding: "12px 24px", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
          Réessayer
        </button>
        <a href="/" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", color: "#F5F0E8", textDecoration: "none", padding: "12px 24px", borderRadius: 10, fontSize: 14, fontWeight: 600 }}>
          Retour à l&apos;accueil
        </a>
      </div>
    </div>
  )
}
