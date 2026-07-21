import { ImageResponse } from "next/og"

// Icone "ajouter a l'ecran d'accueil" iOS (Safari ignore le SVG pour l'apple-touch-icon).
// Genere un vrai PNG a partir du cadre de scan QRowg (identique a icon.svg), rendu via
// une <img> data-URI SVG. iOS applique lui-meme le masque arrondi par-dessus.
export const size = { width: 180, height: 180 }
export const contentType = "image/png"

const ICON_SVG = `<svg width="180" height="180" viewBox="0 0 1024 1024" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="bg" x1="0" y1="0" x2="360" y2="1024" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#2A2A2A"/><stop offset="1" stop-color="#0E0E0E"/></linearGradient></defs><rect width="1024" height="1024" rx="232" fill="url(#bg)"/><g fill="#E9C86B"><rect x="175" y="175" width="140" height="50" rx="25"/><rect x="175" y="175" width="50" height="140" rx="25"/><rect x="709" y="175" width="140" height="50" rx="25"/><rect x="799" y="175" width="50" height="140" rx="25"/><rect x="175" y="799" width="140" height="50" rx="25"/><rect x="175" y="709" width="50" height="140" rx="25"/><rect x="709" y="799" width="140" height="50" rx="25"/><rect x="799" y="709" width="50" height="140" rx="25"/><rect x="335" y="315" width="54" height="54" rx="15"/><rect x="485" y="315" width="54" height="54" rx="15"/><rect x="635" y="315" width="54" height="54" rx="15"/><rect x="232" y="476" width="560" height="72" rx="36"/><rect x="378" y="645" width="54" height="54" rx="15"/><rect x="592" y="645" width="54" height="54" rx="15"/></g></svg>`

export default function AppleIcon() {
  const src = `data:image/svg+xml;utf8,${encodeURIComponent(ICON_SVG)}`
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#0E0E0E" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img width={180} height={180} src={src} alt="QRowg" />
      </div>
    ),
    { ...size }
  )
}
