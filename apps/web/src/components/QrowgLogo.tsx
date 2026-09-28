// Logo QRowg — source unique, réutilisée PARTOUT : vitrine, auth, pied de page,
// coquille du tableau de bord et éditeur (revue du 9 septembre : un seul logo).
// Aplat, sans dégradé ni ombre, pour suivre la couche « Calme ».
//
// DEUX formes, un seul fichier — et c'est le point : une seconde forme dessinée
// à côté dériverait de celle-ci au premier ajustement.
//
//  · `capsule` (défaut) : « QR » en pastille d'accent + « owg ». C'est la forme
//    du site public et de l'éditeur ; rien n'y change.
//  · `wordmark` : « qrowg » d'un seul tenant, en minuscules, avec un point carré
//    doré en fin de mot. Retenue pour la coquille de l'espace connecté (refonte
//    du 28 septembre) : la capsule y lisait comme deux morceaux séparés — « QR »
//    puis « owg » — là où la marque doit se lire d'un trait, à côté d'un fil
//    d'Ariane et d'une colonne de navigation.
export default function QrowgLogo({ size = 22, variant = "capsule" }: { size?: number; variant?: "capsule" | "wordmark" }) {
  if (variant === "wordmark") {
    // Le point doré vaut un cinquième de la hauteur du mot (6 px à 28) et garde
    // son écart : c'est l'accent de la marque, pas une bordure décorative.
    const point = Math.max(4, Math.round(size * 0.21))
    return (
      <span style={{
        display: "inline-flex", alignItems: "center", gap: Math.round(size * 0.2),
        fontFamily: "'Inter', system-ui, sans-serif", lineHeight: 1, userSelect: "none",
      }}>
        <span style={{ color: "var(--qd-ink, var(--ink, #F1F1E9))", fontSize: size, fontWeight: 640, letterSpacing: -1 }}>qrowg</span>
        <span aria-hidden="true" style={{
          display: "block", width: point, height: point, borderRadius: 2,
          background: "var(--accent, #D4AF45)", marginTop: Math.round(size * 0.29),
        }} />
      </span>
    )
  }
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
