// Logo QRowg — « QR » en capsule (aplat d'accent) + « owg » (wordmark). Source
// unique, réutilisée PARTOUT : vitrine, auth, pied de page, coquille du tableau
// de bord et éditeur (revue du 9 septembre : un seul logo). Aplat, sans dégradé
// ni ombre, pour suivre la couche « Calme » de l'application.
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
        background: "var(--accent, #D4AF45)",
        color: "var(--ink-on-accent, #15150F)", fontWeight: 800, fontSize: Math.round(size * 0.82),
        letterSpacing: "-0.02em",
      }}>QR</span>
      <span style={{ color: "var(--ink, #F4F1E8)", fontWeight: 700, fontSize: size, letterSpacing: "-0.01em" }}>owg</span>
      {/* Nom complet accessible aux lecteurs d'écran / SEO */}
      <span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>QRowg</span>
    </span>
  )
}
