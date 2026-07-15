// Fallback Suspense partage de tout le segment /dashboard (audit §17).
// S'affiche dans la zone de contenu (la nav du layout reste) pendant que la
// page serveur attend ses donnees -> skeleton coherent au lieu d'un ecran
// vide/sombre. Classe .skeleton = shimmer defini dans globals.css.

export default function DashboardLoading() {
  const card = (h: number): React.CSSProperties => ({ height: h, borderRadius: 16 })
  return (
    <div style={{ minHeight: "100dvh", padding: "clamp(18px, 4vw, 30px) clamp(16px, 4vw, 28px) 48px", fontFamily: "DM Sans, sans-serif" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        {/* En-tete : titre + sous-titre + action */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 14, flexWrap: "wrap", marginBottom: 24 }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div className="skeleton" style={{ width: "min(280px, 70%)", height: 34, marginBottom: 12 }} />
            <div className="skeleton" style={{ width: 150, height: 15 }} />
          </div>
          <div className="skeleton" style={{ width: 150, height: 44, borderRadius: 12 }} />
        </div>

        {/* Bandeau principal */}
        <div className="skeleton" style={{ ...card(96), marginBottom: 20 }} />

        {/* Rangee de cartes / KPI (s'empile naturellement) */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(220px, 100%), 1fr))", gap: 14, marginBottom: 20 }}>
          <div className="skeleton" style={card(320)} />
          <div className="skeleton" style={card(320)} />
        </div>
      </div>
    </div>
  )
}
