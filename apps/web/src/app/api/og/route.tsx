import { ImageResponse } from "next/og"
import { NextRequest } from "next/server"

export const runtime = "edge"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const title = searchParams.get("title") || "QRfolio"
  const name = searchParams.get("name") || ""
  const plan = searchParams.get("plan") || "free"

  const planColors: Record<string, string> = {
    free: "#8A8478", pro: "#C9A84C", business: "#39FF8F"
  }
  const color = planColors[plan] || "#C9A84C"

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#080808", fontFamily: "serif", position: "relative" }}>
        {/* Background gradient */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: `radial-gradient(ellipse at 50% 0%, ${color}15, transparent 60%)`, display: "flex" }} />
        {/* Top border */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: `linear-gradient(90deg, transparent, ${color}, transparent)`, display: "flex" }} />

        {/* Logo */}
        <div style={{ fontSize: 28, fontWeight: 700, color: color, marginBottom: 24, letterSpacing: 2, display: "flex" }}>QRfolio</div>

        {/* Avatar placeholder */}
        <div style={{ width: 96, height: 96, borderRadius: "50%", background: `linear-gradient(135deg, ${color}, ${color}80)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, fontWeight: 700, color: "#080808", marginBottom: 20, border: `3px solid ${color}50` }}>
          {(name || title)[0]?.toUpperCase() || "Q"}
        </div>

        {/* Title */}
        <div style={{ fontSize: 42, fontWeight: 700, color: "#F5F0E8", textAlign: "center", maxWidth: 800, marginBottom: 12, display: "flex" }}>{title}</div>
        {name && <div style={{ fontSize: 22, color: "#8A8478", marginBottom: 20, display: "flex" }}>{name}</div>}

        {/* QRfolio badge */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: `${color}15`, border: `1px solid ${color}30`, borderRadius: 20, padding: "8px 20px", marginTop: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, display: "flex" }} />
          <span style={{ color: color, fontSize: 16, fontWeight: 600, display: "flex" }}>qrfolio.app/{name?.toLowerCase().replace(/ /g, "-") || "page"}</span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
