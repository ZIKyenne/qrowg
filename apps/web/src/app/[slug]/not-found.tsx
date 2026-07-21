"use client"
export default function NotFound() {
  return (
    <div style={{ minHeight: "100dvh", background: "#080808", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "DM Sans, sans-serif", padding: 24 }}>
      <p style={{ fontFamily: "Fraunces, serif", fontSize: 80, color: "#C9A84C", fontWeight: 700, margin: "0 0 16px", lineHeight: 1 }}>404</p>
      <p style={{ color: "#F5F0E8", fontSize: 20, fontWeight: 600, margin: "0 0 8px" }}>Page introuvable</p>
      <p style={{ color: "#A8A190", fontSize: 14, margin: "0 0 28px", textAlign: "center" }}>Cette page n'existe pas ou n'est plus publiée.</p>
      <a href="/" style={{ background: "linear-gradient(90deg,#C9A84C,#b8953f)", color: "#080808", textDecoration: "none", padding: "12px 24px", borderRadius: 10, fontSize: 14, fontWeight: 700 }}>Retour à l'accueil</a>
    </div>
  )
}
