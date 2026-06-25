"use client"

import { useEffect } from "react"
import { AlertTriangle, RotateCw, ArrowLeft } from "lucide-react"

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error("Dashboard error:", error) }, [error])

  return (
    <div style={{ minHeight: "100vh", background: "#080808", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "DM Sans, sans-serif" }}>
      <div style={{ maxWidth: 460, width: "100%", textAlign: "center", background: "#100F0A", border: "1px solid rgba(255,107,107,0.25)", borderRadius: 18, padding: "36px 28px", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
        <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(255,107,107,0.12)", border: "1px solid rgba(255,107,107,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <AlertTriangle size={24} color="#FF6B6B" />
        </div>
        <h1 style={{ color: "#F8F4EC", fontSize: 22, fontWeight: 700, margin: "0 0 8px", fontFamily: "Cormorant Garamond, serif" }}>Oups, un souci est survenu</h1>
        <p style={{ color: "#C9C3B6", fontSize: 13.5, margin: "0 0 20px", lineHeight: 1.6 }}>
          Cette page n'a pas pu s'afficher. Réessayez — si le problème persiste, rechargez complètement ou contactez le support.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <button type="button" onClick={() => reset()}
            style={{ display: "flex", alignItems: "center", gap: 7, padding: "11px 20px", borderRadius: 11, background: "linear-gradient(90deg,var(--accent,#C9A84C),#b8953f)", color: "#080808", border: "none", fontSize: 13.5, fontWeight: 800, cursor: "pointer" }}>
            <RotateCw size={15} /> Réessayer
          </button>
          <a href="/dashboard"
            style={{ display: "flex", alignItems: "center", gap: 7, padding: "11px 20px", borderRadius: 11, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#F5F0E8", textDecoration: "none", fontSize: 13.5, fontWeight: 600 }}>
            <ArrowLeft size={15} /> Tableau de bord
          </a>
        </div>
        {(error?.message || error?.digest) && (
          <p style={{ color: "#6F6A60", fontSize: 11, margin: "18px 0 0", fontFamily: "monospace", wordBreak: "break-word" }}>
            {error.message || ""}{error.digest ? ` (réf. ${error.digest})` : ""}
          </p>
        )}
      </div>
    </div>
  )
}
