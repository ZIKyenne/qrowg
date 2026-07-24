// Logo QRowg — "QR" en capsule (badge or) + "owg" (wordmark). Source unique
// réutilisée partout (landing, auth, footer) pour une identité cohérente.
export default function QrowgLogo({ size = 22 }: { size?: number }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: Math.round(size * 0.26),
      fontFamily: "'DM Sans', system-ui, sans-serif", lineHeight: 1, userSelect: "none",
    }}>
      <span aria-hidden="true" style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        padding: `${Math.round(size * 0.16)}px ${Math.round(size * 0.3)}px`,
        borderRadius: Math.round(size * 0.4),
        background: "linear-gradient(135deg, #EBCE72 0%, #C9A84C 55%, #b0893a 100%)",
        color: "#0A0A0A", fontWeight: 800, fontSize: Math.round(size * 0.82),
        letterSpacing: "-0.02em",
        boxShadow: "0 2px 12px rgba(201,168,76,0.35), inset 0 1px 0 rgba(255,255,255,0.4)",
      }}>QR</span>
      <span style={{ color: "#F5F0E8", fontWeight: 700, fontSize: size, letterSpacing: "-0.01em" }}>owg</span>
      {/* Nom complet accessible aux lecteurs d'écran / SEO */}
      <span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>QRowg</span>
    </span>
  )
}
