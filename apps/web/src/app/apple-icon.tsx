import { ImageResponse } from "next/og"

// Icone "ajouter a l'ecran d'accueil" iOS (Safari ignore le SVG pour l'apple-touch-icon).
// Genere un vrai PNG a partir du logo QRowg (cadre QR dore + centre plein sur fond sombre).
// Fond plein-cadre : iOS applique lui-meme le masque arrondi.
export const size = { width: 180, height: 180 }
export const contentType = "image/png"

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", background: "#0A0A0A", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 96, height: 96, border: "14px solid #C9A84C", borderRadius: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 40, height: 40, background: "#C9A84C", borderRadius: 12 }} />
        </div>
      </div>
    ),
    { ...size }
  )
}
